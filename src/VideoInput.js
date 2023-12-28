import React, { useEffect, useRef, useState } from "react"
import * as faceapi from 'face-api.js';
import { fabric } from "fabric";

export default function VideoInput({ width, height }) {
    const inputRef = useRef();
    const videoRef = useRef();
    const canvasRef = useRef();
    const [source, setSource] = useState();
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [videoCanvas, setVideoCanvas] = useState('');

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
        loadModels();
    }, []);

    function initCanvas() {
        new fabric.Canvas('canvas', {
            height: videoRef.current.clientHeight,
            width: videoRef.current.clientWidth,
            backgroundColor: 'pink',
        });
    }
    
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
    function handleVideoOnPlay() {
        setInterval(async () => {
            // setVideoCanvas(() => initCanvas());
            // console.log(videoCanvas);
            if ( canvasRef && canvasRef.current ) {
                canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current);
                const displaySize = {
                    width: videoRef.current.clientWidth,
                    height: videoRef.current.clientHeight
                }

                faceapi.matchDimensions(canvasRef.current, displaySize);

                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withAgeAndGender();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);

                canvasRef && canvasRef.current && canvasRef.current.getContext('2d').clearRect(0, 0, displaySize.width, displaySize.height);
                
                // show the box of the face
                canvasRef && canvasRef.current && faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
                
                // show the face landmarks 
                canvasRef && canvasRef.current && faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

                // show the face emotions
                canvasRef && canvasRef.current && faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);
                
                // show the age and gender
                resizedDetections.forEach(result => {
                    const { age, gender, genderProbability } = result;

                    const roundedAge = Math.round(age);
                    const roundedGenderProb = Math.round(genderProbability * 100);

                    const text = `${roundedAge} years, ${gender} (${roundedGenderProb}%)`;

                    const bottomLeft = {
                        x: result.detection.box.topLeft.x + 50,
                        y: result.detection.box.topLeft.y - 25 // Adjust this value to set distance below the emotions
                    };

                    new faceapi.draw.DrawTextField(
                        [ text ],
                        bottomLeft
                    ).draw(canvasRef.current);
                });
            }
        }, 1000);
    }

    return (
        <div className="VideoInput" style={{ position: 'relative' }}>
            {modelsLoaded && <input ref={inputRef} className="VideoInput_input" type="file" onChange={(e) => handleChange(e.target.files[0])} accept=".mov, .mp4" />}
            {!source && <button onClick={() => handleChoose()}>Choose</button>}
            {source && modelsLoaded && (
                <>
                <video ref={videoRef} id="video" className="VideoInput_video" width="70%" height="30%" controls src={source} onPlay={ handleVideoOnPlay} />
                <canvas ref={canvasRef} id="canvas" style={{ position: 'absolute' }} />
                </>
            )}
        </div>
    )
}