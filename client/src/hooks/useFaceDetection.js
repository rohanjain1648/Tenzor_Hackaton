import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { useKYCStore } from '../stores/kycStore';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js-models@master';

export default function useFaceDetection(videoRef) {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detection, setDetection] = useState(null);
  const { setEstimatedAge } = useKYCStore();
  const ageHistory = useRef([]);
  const requestRef = useRef();

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
        ]);
        console.log('Face-api models loaded');
        setModelsLoaded(true);
      } catch (err) {
        console.error('Error loading face-api models:', err);
      }
    };
    loadModels();
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const detectFaces = useCallback(async () => {
    if (!modelsLoaded || !videoRef.current || videoRef.current.paused || videoRef.current.ended) {
      requestRef.current = requestAnimationFrame(detectFaces);
      return;
    }

    const video = videoRef.current;
    
    try {
      const result = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withAgeAndGender();

      if (result) {
        setDetection({
          age: result.age,
          gender: result.gender,
          genderProbability: result.genderProbability,
          box: result.detection.box,
          dims: { width: video.videoWidth, height: video.videoHeight }
        });

        // Smoothing age
        ageHistory.current.push(result.age);
        if (ageHistory.current.length > 20) ageHistory.current.shift();
        
        const avgAge = ageHistory.current.reduce((a, b) => a + b, 0) / ageHistory.current.length;
        setEstimatedAge(Math.round(avgAge));
      } else {
        setDetection(null);
      }
    } catch (err) {
      // console.error('Detection error:', err);
    }

    requestRef.current = requestAnimationFrame(detectFaces);
  }, [modelsLoaded, videoRef, setEstimatedAge]);

  useEffect(() => {
    if (modelsLoaded) {
      requestRef.current = requestAnimationFrame(detectFaces);
    }
  }, [modelsLoaded, detectFaces]);

  return { modelsLoaded, detection };
}
