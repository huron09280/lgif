import Foundation
import ImageIO
import AVFoundation

func printUsage() {
    print("Usage: livephoto-writer --image <input-img> --video <input-vid> --output-image <out-img> --output-video <out-vid> --uuid <uuid>")
}

func main() {
    let args = ProcessInfo.processInfo.arguments
    var inputImage: String?
    var inputVideo: String?
    var outputImage: String?
    var outputVideo: String?
    var uuid: String?

    var i = 1
    while i < args.count {
        switch args[i] {
        case "--image":
            if i + 1 < args.count { inputImage = args[i+1]; i += 1 }
        case "--video":
            if i + 1 < args.count { inputVideo = args[i+1]; i += 1 }
        case "--output-image":
            if i + 1 < args.count { outputImage = args[i+1]; i += 1 }
        case "--output-video":
            if i + 1 < args.count { outputVideo = args[i+1]; i += 1 }
        case "--uuid":
            if i + 1 < args.count { uuid = args[i+1]; i += 1 }
        default:
            break
        }
        i += 1
    }

    guard let imgIn = inputImage, let vidIn = inputVideo,
          let imgOut = outputImage, let vidOut = outputVideo,
          let assetId = uuid else {
        printUsage()
        exit(1)
    }

    print("Processing Live Photo Metadata...")
    print("Asset ID: \(assetId)")

    // 1. Process Image
    let imageURL = URL(fileURLWithPath: imgIn)
    let outputImageURL = URL(fileURLWithPath: imgOut)
    
    guard let imageSource = CGImageSourceCreateWithURL(imageURL as CFURL, nil),
          let imageType = CGImageSourceGetType(imageSource) else {
        print("Error: Cannot read source image.")
        exit(2)
    }
    
    guard let properties = CGImageSourceCopyPropertiesAtIndex(imageSource, 0, nil) as? [CFString: Any] else {
        print("Error: Cannot copy image properties.")
        exit(3)
    }
    
    var mutableProperties = properties
    var makerApple = mutableProperties[kCGImagePropertyMakerAppleDictionary] as? [String: Any] ?? [:]
    makerApple["17"] = assetId // Apple Maker Note Asset ID 17
    mutableProperties[kCGImagePropertyMakerAppleDictionary] = makerApple
    
    guard let destination = CGImageDestinationCreateWithURL(outputImageURL as CFURL, imageType, 1, nil) else {
        print("Error: Cannot create image destination.")
        exit(4)
    }
    
    CGImageDestinationAddImageFromSource(destination, imageSource, 0, mutableProperties as CFDictionary)
    guard CGImageDestinationFinalize(destination) else {
        print("Error: Failed to write image metadata.")
        exit(5)
    }
    print("Success: Image metadata written.")

    // 2. Process Video
    let videoURL = URL(fileURLWithPath: vidIn)
    let outputVideoURL = URL(fileURLWithPath: vidOut)
    
    // Remove output video file if it already exists
    try? FileManager.default.removeItem(at: outputVideoURL)
    
    let asset = AVAsset(url: videoURL)
    
    guard let writer = try? AVAssetWriter(outputURL: outputVideoURL, fileType: .mov) else {
        print("Error: Cannot create AVAssetWriter.")
        exit(6)
    }
    
    // Add global content identifier metadata
    let contentIdItem = AVMutableMetadataItem()
    contentIdItem.keySpace = .quickTimeMetadata
    contentIdItem.key = AVMetadataKey.quickTimeMetadataKeyContentIdentifier as NSString
    contentIdItem.value = assetId as NSString
    contentIdItem.dataType = kCMMetadataBaseDataType_UTF8 as String
    writer.metadata = [contentIdItem]
    
    let semaphore = DispatchSemaphore(value: 0)
    var writeSuccess = false
    var writeError: Error?
    
    asset.loadValuesAsynchronously(forKeys: ["tracks"]) {
        var error: NSError? = nil
        let status = asset.statusOfValue(forKey: "tracks", error: &error)
        guard status == .loaded else {
            writeError = error
            semaphore.signal()
            return
        }
        
        guard let reader = try? AVAssetReader(asset: asset) else {
            writeError = NSError(domain: "LivePhotoWriter", code: 7, userInfo: [NSLocalizedDescriptionKey: "Cannot create AVAssetReader"])
            semaphore.signal()
            return
        }
        
        var outputs: [AVAssetReaderOutput] = []
        var inputs: [AVAssetWriterInput] = []
        
        // Setup outputs and inputs for video tracks
        for track in asset.tracks {
            let output = AVAssetReaderTrackOutput(track: track, outputSettings: nil)
            let input = AVAssetWriterInput(mediaType: track.mediaType, outputSettings: nil)
            
            if reader.canAdd(output) && writer.canAdd(input) {
                reader.add(output)
                writer.add(input)
                outputs.append(output)
                inputs.append(input)
            }
        }
        
        // Add still-image-time metadata track
        let stillImageTimeKey = "com.apple.quicktime.still-image-time"
        let spec: NSDictionary = [
            kCMMetadataFormatDescriptionMetadataSpecificationKey_Identifier as NSString: "mdta/\(stillImageTimeKey)",
            kCMMetadataFormatDescriptionMetadataSpecificationKey_DataType as NSString: kCMMetadataBaseDataType_SInt8
        ]
        var desc: CMFormatDescription?
        CMMetadataFormatDescriptionCreateWithMetadataSpecifications(
            allocator: kCFAllocatorDefault,
            metadataType: kCMMetadataFormatType_Boxed,
            metadataSpecifications: [spec] as CFArray,
            formatDescriptionOut: &desc
        )
        
        guard let formatDesc = desc else {
            writeError = NSError(domain: "LivePhotoWriter", code: 8, userInfo: [NSLocalizedDescriptionKey: "Failed to create format description"])
            semaphore.signal()
            return
        }
        
        let metaInput = AVAssetWriterInput(mediaType: .metadata, outputSettings: nil, sourceFormatHint: formatDesc)
        let metaAdaptor = AVAssetWriterInputMetadataAdaptor(assetWriterInput: metaInput)
        
        if writer.canAdd(metaInput) {
            writer.add(metaInput)
        }
        
        guard reader.startReading(), writer.startWriting() else {
            writeError = reader.error ?? writer.error
            semaphore.signal()
            return
        }
        
        writer.startSession(atSourceTime: .zero)
        
        // Write the still-image-time metadata
        let item = AVMutableMetadataItem()
        item.key = stillImageTimeKey as NSString
        item.keySpace = .quickTimeMetadata
        item.value = 0 as NSNumber
        item.dataType = kCMMetadataBaseDataType_SInt8 as String
        
        let timeRange = CMTimeRange(start: .zero, duration: CMTime(value: 1, timescale: 100))
        let group = AVTimedMetadataGroup(items: [item], timeRange: timeRange)
        metaAdaptor.append(group)
        
        // Parallel track copying
        let groupQueue = DispatchGroup()
        
        for idx in 0..<inputs.count {
            let input = inputs[idx]
            let output = outputs[idx]
            groupQueue.enter()
            
            input.requestMediaDataWhenReady(on: DispatchQueue(label: "track-copy-\(idx)")) {
                while input.isReadyForMoreMediaData {
                    if let buffer = output.copyNextSampleBuffer() {
                        input.append(buffer)
                    } else {
                        input.markAsFinished()
                        groupQueue.leave()
                        break
                    }
                }
            }
        }
        
        groupQueue.notify(queue: DispatchQueue.global()) {
            writer.finishWriting {
                reader.cancelReading()
                writeSuccess = writer.status == .completed
                writeError = writer.error
                semaphore.signal()
            }
        }
    }
    
    semaphore.wait()
    
    if writeSuccess {
        print("Success: Video metadata and track copying complete.")
        exit(0)
    } else {
        print("Error copying video: \(String(describing: writeError))")
        exit(9)
    }
}

main()
