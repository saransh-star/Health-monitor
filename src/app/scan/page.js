'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { savePendingUpload, getPendingUploads, removePendingUpload } from '../lib/storage';
import { saveMeal } from '../actions';
import NutritionCard from '../components/NutritionCard';
import { IoCameraOutline, IoImageOutline, IoCloseCircle, IoCheckmarkCircle, IoRefreshOutline, IoTextOutline } from 'react-icons/io5';

export default function ScanPage() {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [inputMode, setInputMode] = useState('image'); // 'image' or 'text'
    const [textInput, setTextInput] = useState('');
    const [imageDescription, setImageDescription] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const streamRef = useRef(null);
    const [pendingUploads, setPendingUploads] = useState([]);

    // Default to current local time in YYYY-MM-DDThh:mm format for datetime-local
    const getLocalISOString = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };
    const [mealTime, setMealTime] = useState(getLocalISOString());

    const loadPendingUploads = useCallback(async () => {
        const uploads = await getPendingUploads();
        setPendingUploads(uploads);
    }, []);

    useEffect(() => {
        loadPendingUploads();
    }, [loadPendingUploads]);

    // Ensure the video element gets the stream once it mounts
    useEffect(() => {
        if (cameraActive && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [cameraActive]);

    const startCamera = useCallback(async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                if (cameraInputRef.current) {
                    cameraInputRef.current.click();
                } else {
                    setError('Camera not available. Please use file upload instead.');
                }
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
            });
            streamRef.current = stream;
            setCameraActive(true);
            setError(null);
        } catch (err) {
            console.error('Camera error:', err);
            setError('Live camera failed. Please use the "Upload Photo" button instead.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    }, []);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPreview(dataUrl);
        setImage(dataUrl.split(',')[1]);
        stopCamera();
    }, [stopCamera]);

    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1024;
                    const MAX_HEIGHT = 1024;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    resolve(dataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const dataUrl = await compressImage(file);
            setPreview(dataUrl);
            setImage(dataUrl.split(',')[1]);

            // Set meal time to when the photo was originally taken, if available
            if (file.lastModified) {
                const d = new Date(file.lastModified);
                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                setMealTime(d.toISOString().slice(0, 16));
            } else {
                setMealTime(getLocalISOString());
            }
        } catch (err) {
            setError('Failed to process image file');
        }

        setResult(null);
        setSaved(false);
        setError(null);
    };

    const analyzeFood = async () => {
        if (!image) return;
        setAnalyzing(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image, mimeType: 'image/jpeg', description: imageDescription }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.code === 'AI_UNAVAILABLE_RETRY') {
                    await savePendingUpload(image, 'image/jpeg', imageDescription);
                    await loadPendingUploads();
                    setError(data.error);
                    setResult(null);
                    return;
                }
                throw new Error(data.error || 'Analysis failed');
            }
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const analyzeText = async () => {
        if (!textInput.trim()) return;
        setAnalyzing(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch('/api/analyze-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textInput }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Text analysis failed');
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const retryPendingUpload = async (upload) => {
        setAnalyzing(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: upload.image, mimeType: upload.mimeType, description: upload.description }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.code === 'AI_UNAVAILABLE_RETRY') {
                    throw new Error(data.error);
                }
                throw new Error(data.error || 'Analysis failed');
            }

            // Remove from queue on success
            await removePendingUpload(upload.id);
            await loadPendingUploads();

            setResult(data);
            setPreview(`data:${upload.mimeType};base64,${upload.image}`);
            setImage(upload.image);

            if (upload.timestamp) {
                const d = new Date(upload.timestamp);
                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                setMealTime(d.toISOString().slice(0, 16));
            }
        } catch (err) {
            setError('Retry failed: ' + err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const logMeal = async () => {
        if (!result) return;

        // Convert local datetime back to UTC for saving
        const isoTimestamp = new Date(mealTime).toISOString();

        await saveMeal(result, isoTimestamp);
        setSaved(true);
    };

    const reset = () => {
        setImage(null);
        setPreview(null);
        setResult(null);
        setError(null);
        setSaved(false);
        setTextInput('');
        setImageDescription('');
        setMealTime(getLocalISOString());
        stopCamera();
    };

    return (
        <div className="space-y-5 py-4 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-dark-50">Food Scanner</h1>
                <p className="text-sm text-dark-400 mt-1">Take a photo, upload, or describe your food</p>
            </div>

            {/* Input Mode Tabs */}
            {!preview && !cameraActive && !result && (
                <div className="flex bg-dark-800 p-1 rounded-xl">
                    <button
                        onClick={() => setInputMode('image')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${inputMode === 'image'
                            ? 'bg-dark-600 text-dark-50 shadow-sm'
                            : 'text-dark-400 hover:text-dark-200'
                            }`}
                    >
                        Photo
                    </button>
                    <button
                        onClick={() => setInputMode('text')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${inputMode === 'text'
                            ? 'bg-dark-600 text-dark-50 shadow-sm'
                            : 'text-dark-400 hover:text-dark-200'
                            }`}
                    >
                        Manual Entry
                    </button>
                </div>
            )}

            {/* Camera / Upload Area */}
            {inputMode === 'image' && !preview && !cameraActive && (
                <div className="space-y-3">
                    <button
                        onClick={startCamera}
                        className="w-full glass rounded-2xl p-8 flex flex-col items-center gap-3 transition-all hover:bg-dark-800/80 active:scale-[0.98] group"
                    >
                        <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary-500/30 transition-all">
                            <IoCameraOutline className="text-white text-3xl" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-dark-100">Open Camera</p>
                            <p className="text-xs text-dark-400 mt-0.5">Take a photo of your meal</p>
                        </div>
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full glass rounded-2xl p-6 flex items-center gap-4 transition-all hover:bg-dark-800/80 active:scale-[0.98]"
                    >
                        <div className="w-12 h-12 bg-dark-700 rounded-xl flex items-center justify-center">
                            <IoImageOutline className="text-dark-300 text-2xl" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-dark-200">Upload Photo</p>
                            <p className="text-xs text-dark-400">Select from your gallery</p>
                        </div>
                    </button>
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            )}

            {/* Manual Text Entry Area */}
            {inputMode === 'text' && !result && !analyzing && (
                <div className="space-y-4">
                    <div className="glass rounded-2xl p-4">
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Describe your meal (e.g., '2 boiled eggs and 1 slice of whole wheat toast')"
                            className="w-full bg-transparent text-dark-100 placeholder-dark-500 focus:outline-none resize-none min-h-[120px]"
                        ></textarea>
                    </div>
                    <button
                        onClick={analyzeText}
                        disabled={!textInput.trim()}
                        className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2"
                    >
                        <IoTextOutline className="text-xl" />
                        Analyze Description ✨
                    </button>
                </div>
            )}

            {/* Live Camera */}
            {cameraActive && (
                <div className="relative rounded-2xl overflow-hidden">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full aspect-[4/3] object-cover rounded-2xl"
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                        <button
                            onClick={stopCamera}
                            className="w-12 h-12 bg-dark-900/80 backdrop-blur rounded-full flex items-center justify-center text-white"
                        >
                            <IoCloseCircle className="text-2xl" />
                        </button>
                        <button
                            onClick={capturePhoto}
                            className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30 active:scale-90 transition-transform"
                        >
                            <div className="w-14 h-14 border-2 border-white rounded-full" />
                        </button>
                        <div className="w-12" />
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            )}

            {/* Preview */}
            {preview && (
                <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden">
                        <img src={preview} alt="Food preview" className="w-full aspect-[4/3] object-cover" />
                        <button
                            onClick={reset}
                            className="absolute top-3 right-3 w-8 h-8 bg-dark-900/80 backdrop-blur rounded-full flex items-center justify-center text-white"
                        >
                            <IoCloseCircle />
                        </button>
                    </div>

                    {!result && !analyzing && (
                        <div className="space-y-4">
                            <div className="glass rounded-xl p-3">
                                <textarea
                                    value={imageDescription}
                                    onChange={(e) => setImageDescription(e.target.value)}
                                    placeholder="Optional: Provide more details about the meal (amount, hidden ingredients...)"
                                    className="w-full bg-transparent text-dark-100 placeholder-dark-500 focus:outline-none resize-none min-h-[60px] text-sm"
                                ></textarea>
                            </div>
                            <button
                                onClick={analyzeFood}
                                className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.98]"
                            >
                                Analyze Nutrition ✨
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Loading */}
            {analyzing && (
                <div className="glass rounded-2xl p-8 flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-2 border-primary-500/30 rounded-full" />
                        <div className="absolute inset-0 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-2 border-2 border-accent-500 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                    </div>
                    <div className="text-center">
                        <p className="text-dark-100 font-medium">Analyzing your meal...</p>
                        <p className="text-xs text-dark-400 mt-1">AI is identifying food items and nutrition</p>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-danger/10 border border-danger/30 rounded-2xl p-4 flex items-start gap-3">
                    <IoCloseCircle className="text-danger text-xl shrink-0 mt-0.5" />
                    <div>
                        <p className="text-danger text-sm font-medium">Analysis Failed</p>
                        <p className="text-dark-300 text-xs mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-4 animate-slide-up">
                    <NutritionCard meal={result} showActions={false} />

                    {!saved ? (
                        <>
                            <div className="glass rounded-xl p-4 flex items-center justify-between">
                                <span className="text-dark-200 text-sm font-medium">Meal Time:</span>
                                <input
                                    type="datetime-local"
                                    value={mealTime}
                                    onChange={(e) => setMealTime(e.target.value)}
                                    className="bg-dark-900 border border-dark-700 text-dark-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary-500"
                                />
                            </div>
                            <button
                                onClick={logMeal}
                                className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.98]"
                            >
                                <IoCheckmarkCircle className="text-xl" />
                                Log This Meal
                            </button>
                        </>
                    ) : (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
                            <p className="text-green-400 text-sm font-medium flex items-center justify-center gap-2">
                                <IoCheckmarkCircle /> Meal logged successfully!
                            </p>
                        </div>
                    )}

                    <button
                        onClick={reset}
                        className="w-full glass text-dark-200 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-dark-800/80 active:scale-[0.98]"
                    >
                        <IoRefreshOutline />
                        Scan Another Meal
                    </button>
                </div>
            )}
            {/* Pending Uploads Queue */}
            {pendingUploads.length > 0 && !cameraActive && !preview && (
                <div className="space-y-3 mt-8">
                    <h2 className="text-dark-200 font-semibold text-lg flex items-center justify-between">
                        Pending Uploads
                        <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-full">
                            {pendingUploads.length} Waiting
                        </span>
                    </h2>
                    <div className="space-y-3">
                        {pendingUploads.map((upload) => (
                            <div key={upload.id} className="glass rounded-xl p-3 flex items-center gap-4">
                                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-dark-800">
                                    <img
                                        src={`data:${upload.mimeType};base64,${upload.image}`}
                                        alt="Pending"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-dark-200 text-sm font-medium pt-1">Saved Offline</p>
                                    <p className="text-dark-400 text-xs">
                                        {new Date(upload.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => retryPendingUpload(upload)}
                                            className="px-3 py-1.5 gradient-primary text-white text-xs font-semibold rounded-lg flex-1"
                                            disabled={analyzing}
                                        >
                                            Retry Now
                                        </button>
                                        <button
                                            onClick={async () => {
                                                await removePendingUpload(upload.id);
                                                await loadPendingUploads();
                                            }}
                                            className="p-1.5 text-dark-400 hover:text-danger hover:bg-danger/10 rounded-lg shrink-0 transition-colors"
                                            disabled={analyzing}
                                        >
                                            <IoCloseCircle className="text-xl" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
