import React, { useEffect, useRef, useState } from "react"
import * as faceapi from 'face-api.js';
import { fabric } from "fabric";

export default function VideoFabric({ width, height }) {
    const inputRef = useRef();
    const videoRef = useRef();
    const canvasRef = useRef();
    const [source, setSource] = useState();
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [videoCanvas, setVideoCanvas] = useState(null);
    const animationFrame = useRef(null);
    const vRef = useRef();

    // Load the models for face-api
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = process.env.PUBLIC_URL + '/models';

            Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
            ]).then(setModelsLoaded(true));
        }

        const canvas = new fabric.Canvas(canvasRef.current, {
            backgroundColor: "pink",
            width: 500,
            height: 500
        });
        videoRef.current = document.getElementById('video');
        
        const video1 = new fabric.Image(videoRef.current, {
            left: 200,
            top: 300,
            width: 500,
            height: 500,
            angle: 0,
            originX: 'center',
            originY: 'center',
            objectCaching: false,
        });

        canvas.add(video1);
        setFabricCanvas(canvas);
        setVideoCanvas(video1);

        const renderCanvas = () => {
            if (!canvas) return; // Check if canvas is still available
            canvas.renderAll();
            animationFrame.current = fabric.util.requestAnimFrame(renderCanvas);
        };
      
        renderCanvas();
        loadModels();

    }, [source]);

    function playVideo() {
        if (videoRef.current) {
          videoRef.current.play();
          handleVideoOnPlay(fabricCanvas, videoCanvas);
        }
    };

    function pauseVideo() {
        if (videoRef.current) {
          videoRef.current.pause();
        }
    };

    // Select the video file
    function handleChoose() {
        inputRef.current.click();
    }
    // Set the URL of the video file
    function handleChange(file) {
        const url = URL.createObjectURL(file);
        setSource(url);
    }

    // Display the face detectors on playing the video
    function handleVideoOnPlay(canvas, videoCanvas) {
        setInterval(async () => {
            if ( canvasRef && canvasRef.current ) {
                canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current);
                const displaySize = {
                    width: 500,
                    height: 500
                }

                faceapi.matchDimensions(canvasRef.current, displaySize);

                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions());
                
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                // console.log(resizedDetections);

                // canvasRef && canvasRef.current && canvasRef.current.getContext('2d').clearRect(0, 0, displaySize.width, displaySize.height);
                const ctx = canvasRef.current.getContext('2d');

                // Clear the canvas
                ctx.clearRect(0, 0, displaySize.width, displaySize.height);
                
                // show the box of the face
                // canvasRef && canvasRef.current && faceapi.draw.drawDetections(ctx, resizedDetections);
                const fabricCanvas = new fabric.Canvas(canvasRef.current, { selection: false });

                let rect = {};

                resizedDetections.forEach(result => {
                    const { _x, _y, _width, _height } = result._box;
                    console.log(_width,_height);
                
                    // Create a rectangle using Fabric.js for each detection
                    rect = new fabric.Rect({
                      left: _x+canvas.getObjects()[0].left-200,
                      top: _y+canvas.getObjects()[0].top-300,
                      width: _width,
                      height: _height,
                      fill: 'transparent',
                      stroke: 'red',
                      strokeWidth: 2,
                      selectable: false,
                      evented: false,
                    });
                
                    // rects.push(rect);
                    fabricCanvas.add(rect);
                });
                console.log(canvas.getObjects()[0]);
            }
        }, 100);
    }

    return (
        <div className="VideoInput" style={{ position: 'relative' }}>
            {modelsLoaded && <input ref={inputRef} className="VideoInput_input" type="file" onChange={(e) => handleChange(e.target.files[0])} accept=".mov, .mp4" />}
            {!source && <button onClick={() => handleChoose()}>Choose</button>}
            {source && modelsLoaded && (
                <>
                {/* <video ref={videoRef} id="video" className="VideoInput_video" width="70%" height="30%" controls src={source} onPlay={ handleVideoOnPlay} /> */}
                <canvas ref={canvasRef} id="canvas" className="VideoCanvas" width="70%" height="30%"/>
                <video ref={vRef} id="video" style={{ display: "none", position: "absolute" }} src={source} controls width="1000" height="500"></video>
                <button onClick={playVideo}>Play Video</button>
                <button onClick={pauseVideo}>Pause Video</button>
                </>
            )}
        </div>
    )
}