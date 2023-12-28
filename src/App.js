import React from "react";
import "./index.css";
import VideoInput from "./VideoInput"

export default function App() {
  return (
    <div className="App">
      <h1>Video Upload & Face Detection</h1>
      <VideoInput width={400} height={500} />
    </div>
  )
}