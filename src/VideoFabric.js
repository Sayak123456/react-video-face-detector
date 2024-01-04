import React, { useEffect, useRef, useState } from "react"
import * as faceapi from 'face-api.js';
import { fabric } from "fabric";

export default function VideoFabric({ width, height }) {
    const inputRef = useRef();
    const videoRef = useRef();
    const canvasRef = useRef();
    const vDect = useRef();
    const [source, setSource] = useState();
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [loader, setLoader] = useState(true);
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [videoCanvas, setVideoCanvas] = useState(null);
    const [faceDetector, setFaceDetector] = useState([]);
    const animationFrame = useRef(null);
    const vRef = useRef();

    let index=0;
    let currentRect=[];
    let intervalIds=[];

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

    function createAndRenderCanvas() {
        const canvas = new fabric.Canvas(canvasRef.current, {
            backgroundColor: "pink",
            width: 500,
            height: 500
        });
        videoRef.current = document.getElementById('video');
        vDect.current = document.getElementById('videoDect');
        
        const video1 = new fabric.Image(videoRef.current, {
            left: 200,
            top: 300,
            width: 500,
            height: 500,
            angle: 0,
            originX: 'center',
            originY: 'center',
            objectCaching: true,
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
    }

    async function playVideo() {
        if (videoRef.current) {
            videoRef.current.play();
            function drawRect(coord) {
                if(currentRect.length>0 || coord.length===0){
                    currentRect.forEach((curr) => fabricCanvas.remove(curr));
                }
                for(let i=0;i<coord.length;i++){
                    let rect = new fabric.Rect({
                        left: coord[i].box._x-50+fabricCanvas.getObjects()[0].left-200,
                        top: coord[i].box._y+50+fabricCanvas.getObjects()[0].top-300,
                        width: coord[i].box._height+fabricCanvas.getObjects()[0].width-500,
                        height: coord[i].box._width+fabricCanvas.getObjects()[0].height-500,
                        fill: 'transparent',
                        stroke: 'blue',
                        strokeWidth: 2,
                        selectable: false,
                        evented: false,
                    });
                    fabricCanvas.add(rect);
                    fabricCanvas.bringToFront(rect);
                    fabricCanvas.setActiveObject(rect);
                    currentRect.push(rect);
                }
            }
            const intervalId = setInterval(() => {
                if(index<faceDetector.length){
                    drawRect(faceDetector[index]);
                    index++;
                } else {
                    clearInterval(intervalId);
                    if(currentRect.length>0)
                        currentRect.forEach((curr) => fabricCanvas.remove(curr));
                }
            }, 1000)
            intervalIds.push(intervalId);
        }
    };

    async function pauseVideo() {
        videoRef.current.pause();
        if(currentRect.length>0)
            currentRect.forEach((curr) => fabricCanvas.remove(curr));
        intervalIds.forEach((id) => {
            clearInterval(id);
        })
    }

    // Select the video file
    function handleChoose() {
        inputRef.current.click();
    }
    // Set the URL of the video file
    async function handleChange(file) {
        const url = URL.createObjectURL(file);
        await setSource(url);
        console.log(vDect.current);
        await detect();
    }

    async function detect() {
        if(vDect.current){
            vDect.current.playbackRate = 4;
            vDect.current.play();
            vDect.current.muted = true;
            const displaySize = { width: 500, height: 500 };
            const intervalId = setInterval( async() => {
                const detections = await faceapi.detectAllFaces(vDect.current, new faceapi.TinyFaceDetectorOptions());
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                setFaceDetector((item) => [...item,resizedDetections]);
            }, 1000/4);

            vDect.current.addEventListener("ended", async() => {
                clearInterval(intervalId);
                await vDect.current.parentNode.removeChild(vDect.current);
                await createAndRenderCanvas();
                await setLoader(false);
            });
            
        }
    }

    return (
        <>
        {source && <video ref={vDect} id="videoDect" style={{ display: "none" }} src={source} width="0" height="0"></video> }
        <div className="VideoInput" style={{ position: 'relative' }}>
            {modelsLoaded && <input ref={inputRef} className="VideoInput_input" type="file" onChange={(e) => handleChange(e.target.files[0])} accept=".mov, .mp4" />}
            {!source && <button onClick={() => handleChoose()}>Choose</button>}
            { source && loader && <h3>Loading!</h3>}
            {source && modelsLoaded && (
                <>
                <canvas ref={canvasRef} id="canvas" className="VideoCanvas" width="0" height="0" />
                <video ref={vRef} id="video" style={{ display: "none", position: "absolute" }} src={source} controls width="500" height="500"></video>
                {!loader && <button onClick={playVideo}>Play Video</button>}
                {!loader && <button onClick={pauseVideo}>Pause Video</button>}
                </>
            )}
        </div>
        </>
    )
}