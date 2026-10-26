'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { savePendingUpload, getPendingUploads, removePendingUpload } from '../lib/storage';
import { saveMeal } from '../actions';
import Image from 'next/image';
import NutritionCard from '../components/NutritionCard';
import ThemeSwitcher from '../components/ThemeSwitcher';
import {
    LuCamera,
    LuSmartphone,
    LuUpload,
    LuFileText,
    LuSparkles,
    LuRefreshCw,
    LuTrash2,
    LuCheck,
    LuCircleAlert,
    LuClock,
    LuChevronLeft,
    LuSun,
    LuZap,
    LuLayers,
} from 'react-icons/lu';

// Curated demo meals for rapid testing and demonstrations
const DEMO_MEALS = {
    salad: {
        foods: [
            { name: 'Mediterranean Grilled Chicken Salad', portion: '1 large bowl (320g)', calories: 360, protein: 36, carbs: 14, fat: 16, fiber: 6 },
            { name: 'Kalamata Olives & Extra Virgin Olive Oil', portion: '2 tbsp', calories: 90, protein: 0.5, carbs: 2, fat: 9, fiber: 1 },
        ],
        totalCalories: 450,
        totalProtein: 36.5,
        totalCarbs: 16,
        totalFat: 25,
        totalFiber: 7,
        healthScore: 9,
        weightLossTip: 'Rich in dietary fiber and lean poultry protein to sustain mid-afternoon satiety.',
        healthierAlternative: 'Swap high-sodium dressings for fresh lemon juice and cold-pressed olive oil.',
        isDemo: true,
    },
    paneer: {
        foods: [
            { name: 'Spiced Low-Fat Paneer Tikka', portion: '150g grilled', calories: 280, protein: 26, carbs: 8, fat: 16, fiber: 2 },
            { name: 'Steamed Brown Basmati Rice', portion: '1 cup cooked (160g)', calories: 190, protein: 4.5, carbs: 40, fat: 1.5, fiber: 3.5 },
            { name: 'Cucumber & Mint Raita', portion: '0.5 cup (100g)', calories: 75, protein: 4, carbs: 6, fat: 3.5, fiber: 1 },
        ],
        totalCalories: 545,
        totalProtein: 34.5,
        totalCarbs: 54,
        totalFat: 21,
        totalFiber: 6.5,
        healthScore: 8,
        weightLossTip: 'Balanced vegetarian macro ratio. High fiber from brown rice moderates glycemic response.',
        healthierAlternative: 'Opt for non-fat Greek yogurt in raita to boost protein density by 5g.',
        isDemo: true,
    },
    oatmeal: {
        foods: [
            { name: 'Rolled Oats in Almond Milk', portion: '1 bowl (45g dry)', calories: 180, protein: 6, carbs: 32, fat: 3.5, fiber: 5 },
            { name: 'Wild Blueberries & Chia Seeds', portion: '0.5 cup berries + 1 tbsp chia', calories: 95, protein: 3, carbs: 14, fat: 4, fiber: 6 },
            { name: 'Crushed Raw Almonds', portion: '15g (approx 12 nuts)', calories: 90, protein: 3.2, carbs: 3, fat: 7.8, fiber: 1.8 },
        ],
        totalCalories: 365,
        totalProtein: 12.2,
        totalCarbs: 49,
        totalFat: 15.3,
        totalFiber: 12.8,
        healthScore: 10,
        weightLossTip: 'Exceptional 13g soluble and insoluble fiber; ideal morning metabolism stabilizer.',
        healthierAlternative: 'Stir in 1 scoop unflavored plant protein to double the protein ratio.',
        isDemo: true,
    },
};

export default function ScanPage() {
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);
    const [inputMode, setInputMode] = useState('image'); // 'image' | 'text' | 'demo'
    const [textInput, setTextInput] = useState('');
    const [imageDescription, setImageDescription] = useState('');
    const [refinementText, setRefinementText] = useState('');
    const [refining, setRefining] = useState(false);

    // Live Camera state
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraFacing, setCameraFacing] = useState('environment');
    const [torchOn, setTorchOn] = useState(false);
    const [torchSupported, setTorchSupported] = useState(false);
    const [cameraError, setCameraError] = useState(null);

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);
    const nativeCameraRef = useRef(null);
    const [pendingUploads, setPendingUploads] = useState([]);

    const getLocalISOString = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };
    const [mealTime, setMealTime] = useState(getLocalISOString());

    const triggerHaptic = (pattern = 10) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    };

    const loadPendingUploads = useCallback(async () => {
        const uploads = await getPendingUploads();
        setPendingUploads(uploads);
    }, []);

    useEffect(() => {
        loadPendingUploads();
    }, [loadPendingUploads]);

    // Attach stream to HTML5 video element with Android Chrome safeguards
    const attachStreamToVideo = useCallback((videoEl) => {
        if (!videoEl || !streamRef.current) return;
        try {
            if (videoEl.srcObject !== streamRef.current) {
                videoEl.srcObject = streamRef.current;
            }
            videoEl.setAttribute('playsinline', 'true');
            videoEl.setAttribute('webkit-playsinline', 'true');
            videoEl.muted = true;
            const playPromise = videoEl.play();
            if (playPromise !== undefined) {
                playPromise.catch((err) => {
                    console.warn('Video auto-playback deferred:', err);
                });
            }
        } catch (e) {
            console.warn('Error attaching camera stream to video element:', e);
        }
    }, []);

    // Ensure stream is bound if video element mounts after stream is acquired
    useEffect(() => {
        if (isCameraActive && videoRef.current && streamRef.current) {
            attachStreamToVideo(videoRef.current);
        }
    }, [isCameraActive, attachStreamToVideo]);

    // Check query params for demo triggers
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const demoKey = params.get('demo');
            const mode = params.get('mode');

            if (demoKey && DEMO_MEALS[demoKey]) {
                setResult(DEMO_MEALS[demoKey]);
                setInputMode('demo');
            } else if (mode === 'camera') {
                setInputMode('image');
                startCamera();
            } else if (mode === 'upload') {
                setInputMode('image');
                if (fileInputRef.current) {
                    fileInputRef.current.click();
                }
            } else if (mode === 'text') {
                setInputMode('text');
            }
        }
    }, []);

    // Clean up camera stream on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    // Robust multi-strategy camera acquisition specifically optimized for Samsung Galaxy & Android Chrome
    const acquireCameraStream = async (facing) => {
        const strategies = [
            // Strategy 1: Standard mobile 720p/1080p with ideal facingMode
            {
                video: {
                    facingMode: { ideal: facing },
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                },
                audio: false,
            },
            // Strategy 2: Simple string facingMode (resolves OverconstrainedError on Samsung Chrome)
            {
                video: {
                    facingMode: facing,
                },
                audio: false,
            },
            // Strategy 3: exact facingMode constraint
            {
                video: {
                    facingMode: { exact: facing },
                },
                audio: false,
            },
        ];

        let lastErr = null;
        for (const constraints of strategies) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (stream && stream.getVideoTracks().length > 0) {
                    return stream;
                }
            } catch (err) {
                lastErr = err;
                console.warn('Camera constraints attempt failed:', constraints, err.name, err.message);
            }
        }

        // Strategy 4: Device enumeration fallback (picks primary physical rear sensor among multi-lens modules)
        try {
            if (navigator.mediaDevices.enumerateDevices) {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter((d) => d.kind === 'videoinput');

                let targetDevice = null;
                if (facing === 'environment') {
                    targetDevice = videoInputs.find((d) =>
                        /back|rear|environment|main/i.test(d.label)
                    );
                    if (!targetDevice && videoInputs.length > 0) {
                        targetDevice = videoInputs[0];
                    }
                } else {
                    targetDevice = videoInputs.find((d) =>
                        /front|user|selfie|forward/i.test(d.label)
                    );
                }

                if (targetDevice?.deviceId) {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { deviceId: { exact: targetDevice.deviceId } },
                        audio: false,
                    });
                    if (stream && stream.getVideoTracks().length > 0) {
                        return stream;
                    }
                }
            }
        } catch (enumErr) {
            console.warn('Device enumeration fallback error:', enumErr);
        }

        // Strategy 5: Universal fallback
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            if (stream && stream.getVideoTracks().length > 0) {
                return stream;
            }
        } catch (fallbackErr) {
            lastErr = fallbackErr;
        }

        throw lastErr || new Error('Could not access camera on your device.');
    };

    const startCamera = async (facing = cameraFacing) => {
        setCameraError(null);
        stopCamera();

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Live camera is not supported in this browser. You can use your phone camera or upload photos below.');
            }

            const stream = await acquireCameraStream(facing);
            streamRef.current = stream;

            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities ? track.getCapabilities() : {};
            setTorchSupported(!!capabilities.torch);
            setTorchOn(false);

            // Mount video element in DOM
            setIsCameraActive(true);

            // If video element is already present, attach stream immediately
            if (videoRef.current) {
                attachStreamToVideo(videoRef.current);
            }

            triggerHaptic(12);
        } catch (err) {
            console.warn('Live camera error:', err);
            let userMsg = 'Unable to access back camera on this device.';
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                userMsg = 'Camera permission denied. Tap the lock/tune icon in the Chrome address bar to allow camera access, or tap "Phone Camera" below.';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                userMsg = 'Camera hardware is busy in another app or tab. Close other camera apps, or tap "Phone Camera" below.';
            } else if (err.name === 'OverconstrainedError') {
                userMsg = 'Back camera resolution constraint unsupported by lens. Tap "Phone Camera" below.';
            } else if (err.message) {
                userMsg = err.message;
            }
            setCameraError(userMsg);
            setIsCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setIsCameraActive(false);
        setTorchOn(false);
    };

    const toggleTorch = async () => {
        if (!streamRef.current || !torchSupported) return;
        try {
            const track = streamRef.current.getVideoTracks()[0];
            const nextState = !torchOn;
            await track.applyConstraints({
                advanced: [{ torch: nextState }],
            });
            setTorchOn(nextState);
            triggerHaptic(10);
        } catch (e) {
            console.error('Failed to toggle torch', e);
        }
    };

    const flipCamera = async () => {
        const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
        setCameraFacing(nextFacing);
        await startCamera(nextFacing);
    };

    const captureFrame = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;

        // Ensure video is actively playing and has valid dimensions
        if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
            console.warn('Video frame not ready yet for capture');
            return;
        }

        triggerHaptic([15, 35]);

        const canvas = document.createElement('canvas');
        const MAX_DIM = 1200;
        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > height) {
            if (width > MAX_DIM) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
            }
        } else {
            if (height > MAX_DIM) {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
            }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64Data = dataUrl.split(',')[1];

        setPreviews((prev) => [...prev, dataUrl]);
        setImages((prev) => [...prev, base64Data]);
        stopCamera();
    };

    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new window.Image();
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
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        try {
            const newImages = [];
            const newPreviews = [];

            for (const file of files) {
                const dataUrl = await compressImage(file);
                newPreviews.push(dataUrl);
                newImages.push(dataUrl.split(',')[1]);
            }

            setPreviews((prev) => [...prev, ...newPreviews]);
            setImages((prev) => [...prev, ...newImages]);

            if (images.length === 0) {
                const firstFile = files[0];
                if (firstFile.lastModified) {
                    const d = new Date(firstFile.lastModified);
                    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                    setMealTime(d.toISOString().slice(0, 16));
                } else {
                    setMealTime(getLocalISOString());
                }
            }
            triggerHaptic(10);
        } catch (err) {
            setError('Failed to process image files');
        }

        setResult(null);
        setSaved(false);
        setError(null);
    };

    const removeImage = (indexToRemove) => {
        setPreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
        setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
        triggerHaptic(8);
    };

    const analyzeFood = async () => {
        if (!images || images.length === 0) return;
        setAnalyzing(true);
        setError(null);
        setResult(null);
        triggerHaptic(12);

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images, mimeType: 'image/jpeg', description: imageDescription }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.code === 'AI_UNAVAILABLE_RETRY') {
                    await savePendingUpload(images, 'image/jpeg', imageDescription);
                    await loadPendingUploads();
                    setError(data.error);
                    setResult(null);
                    return;
                }
                throw new Error(data.error || 'Analysis failed');
            }
            setResult({ ...data, isDemo: false });
            triggerHaptic([20, 40]);
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
        triggerHaptic(12);

        try {
            const res = await fetch('/api/analyze-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textInput }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Text analysis failed');
            setResult({ ...data, isDemo: false });
            triggerHaptic([20, 40]);
        } catch (err) {
            setError(err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleRefineWithAI = async () => {
        if (!refinementText.trim() || !result) return;
        setRefining(true);
        triggerHaptic(10);

        try {
            const currentSummary = result.foods?.map((f) => `${f.name} (${f.portion})`).join(', ');
            const prompt = `Adjust this meal nutritional calculation based on user refinement:
Current meal: ${currentSummary}
Refinement note: ${refinementText}`;

            const res = await fetch('/api/analyze-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: prompt }),
            });
            const data = await res.json();
            if (res.ok && data.foods) {
                setResult(data);
                setRefinementText('');
                triggerHaptic([20, 40]);
            }
        } catch (e) {
            console.error('Refine failed:', e);
        } finally {
            setRefining(false);
        }
    };

    const logMeal = async () => {
        if (!result) return;
        triggerHaptic([15, 30]);
        const isoTimestamp = new Date(mealTime).toISOString();
        await saveMeal(result, isoTimestamp);
        setSaved(true);
    };

    const reset = () => {
        stopCamera();
        setImages([]);
        setPreviews([]);
        setResult(null);
        setError(null);
        setSaved(false);
        setTextInput('');
        setImageDescription('');
        setRefinementText('');
        setMealTime(getLocalISOString());
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                            AI Food Scanner
                        </h1>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                            Gemini AI
                        </span>
                    </div>
                    <p className="hidden sm:block text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                        Discover calories, macronutrients, and healthy swaps with Google Gemini AI.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:block">
                        <ThemeSwitcher variant="dropdown" />
                    </div>
                    {(previews.length > 0 || result || textInput) && (
                        <button
                            type="button"
                            onClick={reset}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-elevated)] text-xs font-semibold text-[var(--text-primary)] transition-colors nutri-press shadow-xs"
                        >
                            <LuRefreshCw className="text-xs" /> Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Offline queue indicator banner */}
            {pendingUploads.length > 0 && (
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-amber-400">
                        <LuCircleAlert className="text-base shrink-0" />
                        <span>
                            You have {pendingUploads.length} meal scan{pendingUploads.length > 1 ? 's' : ''} saved offline in IndexedDB.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (pendingUploads[0]) {
                                setPreviews(pendingUploads[0].images?.map((img) => `data:image/jpeg;base64,${img}`) || []);
                                setImages(pendingUploads[0].images || []);
                            }
                        }}
                        className="text-xs font-semibold text-amber-400 hover:underline shrink-0"
                    >
                        Load to retry
                    </button>
                </div>
            )}

            {/* Segmented Mode Selector */}
            {!result && !isCameraActive && (
                <div className="nutri-segmented">
                    <button
                        type="button"
                        onClick={() => setInputMode('image')}
                        className={`flex-1 nutri-segmented-item flex items-center justify-center gap-2 ${
                            inputMode === 'image' ? 'nutri-segmented-item-active' : ''
                        }`}
                    >
                        <LuCamera className="text-sm" />
                        <span>Camera & Photo</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setInputMode('text')}
                        className={`flex-1 nutri-segmented-item flex items-center justify-center gap-2 ${
                            inputMode === 'text' ? 'nutri-segmented-item-active' : ''
                        }`}
                    >
                        <LuFileText className="text-sm" />
                        <span>Describe Meal</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setInputMode('demo')}
                        className={`flex-1 nutri-segmented-item flex items-center justify-center gap-2 ${
                            inputMode === 'demo' ? 'nutri-segmented-item-active' : ''
                        }`}
                    >
                        <LuSparkles className="text-sm" />
                        <span>Sample Demos</span>
                    </button>
                </div>
            )}

            {/* LIVE CAMERA VIEWFINDER */}
            {inputMode === 'image' && isCameraActive && (
                <div className="relative rounded-3xl overflow-hidden bg-black aspect-[4/5] sm:aspect-[16/10] w-full border border-[var(--border-color)] shadow-2xl animate-fade-in">
                    <video
                        ref={(el) => {
                            videoRef.current = el;
                            if (el && streamRef.current) {
                                attachStreamToVideo(el);
                            }
                        }}
                        playsInline
                        autoPlay
                        muted
                        onLoadedMetadata={() => {
                            if (videoRef.current) {
                                videoRef.current.play().catch((err) => console.warn('Video play on metadata error:', err));
                            }
                        }}
                        className="w-full h-full object-cover"
                    />

                    {/* Viewfinder target bounds */}
                    <div className="absolute inset-8 border border-white/30 rounded-2xl pointer-events-none flex items-center justify-center">
                        <div className="w-16 h-16 border-t-2 border-l-2 border-[var(--accent-primary)] absolute top-0 left-0 rounded-tl-lg" />
                        <div className="w-16 h-16 border-t-2 border-r-2 border-[var(--accent-primary)] absolute top-0 right-0 rounded-tr-lg" />
                        <div className="w-16 h-16 border-b-2 border-l-2 border-[var(--accent-primary)] absolute bottom-0 left-0 rounded-bl-lg" />
                        <div className="w-16 h-16 border-b-2 border-r-2 border-[var(--accent-primary)] absolute bottom-0 right-0 rounded-br-lg" />
                    </div>

                    {/* Top Camera Controls */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                        <button
                            type="button"
                            onClick={stopCamera}
                            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white nutri-press"
                            title="Exit camera"
                        >
                            <LuChevronLeft className="text-lg" />
                        </button>

                        <div className="flex items-center gap-2">
                            {torchSupported && (
                                <button
                                    type="button"
                                    onClick={toggleTorch}
                                    className={`w-10 h-10 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center nutri-press ${
                                        torchOn ? 'bg-amber-400 text-black' : 'bg-black/60 text-white'
                                    }`}
                                    title="Toggle Flashlight"
                                >
                                    <LuZap className="text-base" />
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={flipCamera}
                                className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white nutri-press"
                                title="Flip Camera"
                            >
                                <LuRefreshCw className="text-base" />
                            </button>
                        </div>
                    </div>

                    {/* Shutter Capture Button */}
                    <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center z-10">
                        <button
                            type="button"
                            onClick={captureFrame}
                            className="w-20 h-20 rounded-full border-4 border-white bg-white/25 backdrop-blur-sm flex items-center justify-center nutri-press group"
                            title="Capture Meal Photo"
                            aria-label="Capture Photo"
                        >
                            <div className="w-14 h-14 rounded-full bg-white group-hover:scale-95 transition-transform" />
                        </button>
                    </div>
                </div>
            )}

            {/* IMAGE MODE (UPLOAD OR START CAMERA) */}
            {inputMode === 'image' && !isCameraActive && !result && (
                <div className="space-y-4">
                    {cameraError && (
                        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                            <div className="flex items-center gap-2.5">
                                <LuCircleAlert className="text-lg shrink-0 text-amber-400" />
                                <span>{cameraError}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => nativeCameraRef.current?.click()}
                                className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 nutri-press hover:bg-amber-400 shadow-xs"
                            >
                                <LuSmartphone className="text-sm" />
                                Snap with Phone Camera
                            </button>
                        </div>
                    )}

                    {previews.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Live Camera Viewfinder Card */}
                            <button
                                type="button"
                                onClick={() => startCamera()}
                                className="nutri-card p-6 flex flex-col items-center justify-center text-center space-y-3 border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-all nutri-press group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    <LuCamera />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                                        Live Viewfinder
                                    </h3>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                                        Real-time camera scanner with framing bounds & live shutter.
                                    </p>
                                </div>
                            </button>

                            {/* Phone Camera Card (Direct Native Samsung / Mobile App) */}
                            <button
                                type="button"
                                onClick={() => nativeCameraRef.current?.click()}
                                className="nutri-card p-6 flex flex-col items-center justify-center text-center space-y-3 border-2 border-dashed border-[var(--border-color)] hover:border-emerald-400 transition-all nutri-press group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    <LuSmartphone />
                                </div>
                                <div>
                                    <div className="flex items-center justify-center gap-1.5">
                                        <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                                            Phone Camera
                                        </h3>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20">
                                            HDR
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                                        Snap high-res photo using your phone's native camera app.
                                    </p>
                                </div>
                            </button>

                            {/* Photo Upload Card */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="nutri-card p-6 flex flex-col items-center justify-center text-center space-y-3 border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent-secondary)] transition-all cursor-pointer nutri-press group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-[var(--accent-secondary)]/15 text-[var(--accent-secondary)] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    <LuUpload />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                                        Upload Gallery
                                    </h3>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                                        Select single or multiple photos (JPEG, PNG, HEIC).
                                    </p>
                                </div>
                            </div>

                            {/* Native camera capture file input for Samsung / Mobile devices */}
                            <input
                                ref={nativeCameraRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            {/* Standard file picker input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        /* Previews Carousel & Analysis Trigger */
                        <div className="nutri-card p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[var(--text-primary)]">
                                    Captured Photos ({previews.length})
                                </span>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1 font-medium"
                                >
                                    <LuUpload className="text-xs" /> Add more
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {previews.map((src, i) => (
                                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border-color)] group">
                                        <Image
                                            src={src}
                                            alt={`Meal photo ${i + 1}`}
                                            fill
                                            unoptimized
                                            className="object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-red-500 transition-colors"
                                            title="Remove photo"
                                        >
                                            <LuTrash2 className="text-xs" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Optional User Notes for AI Context */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[var(--text-secondary)]">
                                    Additional Context (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={imageDescription}
                                    onChange={(e) => setImageDescription(e.target.value)}
                                    placeholder="e.g. Cooked with 1 tbsp olive oil, no sugar added..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                            </div>

                            {/* Action Button */}
                            <button
                                type="button"
                                onClick={analyzeFood}
                                disabled={analyzing}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-semibold text-sm shadow-md shadow-[var(--accent-glow)] flex items-center justify-center gap-2 hover:opacity-95 transition-opacity nutri-press disabled:opacity-50"
                            >
                                {analyzing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Gemini AI is analyzing ingredients & portions...</span>
                                    </>
                                ) : (
                                    <>
                                        <LuSparkles className="text-base" />
                                        <span>Analyze with Gemini Vision</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* TEXT MODE */}
            {inputMode === 'text' && !result && (
                <div className="nutri-card p-6 space-y-4">
                    <div>
                        <h2 className="text-base font-bold text-[var(--text-primary)]">
                            Describe Your Meal
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Type what you ate in natural language. Gemini AI will estimate portions and nutrition.
                        </p>
                    </div>

                    <textarea
                        rows={4}
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="e.g. 2 scrambled eggs with 1 slice whole wheat sourdough, half an avocado, and a black coffee."
                        className="w-full p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                    />

                    <button
                        type="button"
                        onClick={analyzeText}
                        disabled={analyzing || !textInput.trim()}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-semibold text-sm shadow-md shadow-[var(--accent-glow)] flex items-center justify-center gap-2 hover:opacity-95 transition-opacity nutri-press disabled:opacity-50"
                    >
                        {analyzing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Analyzing meal description...</span>
                            </>
                        ) : (
                            <>
                                <LuSparkles className="text-base" />
                                <span>Analyze Meal</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* SAMPLE DEMOS MODE */}
            {inputMode === 'demo' && !result && (
                <div className="space-y-4">
                    <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                        <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                            Interactive Sample Meals
                        </span>
                        <p className="text-xs text-[var(--text-secondary)]">
                            Experience instant multimodal nutrition analysis with real nutritional datasets.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {Object.entries(DEMO_MEALS).map(([key, demo]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    setResult(demo);
                                    triggerHaptic([15, 30]);
                                }}
                                className="nutri-card p-5 text-left space-y-3 hover:border-[var(--accent-primary)] transition-all nutri-press"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider">
                                        Sample {key}
                                    </span>
                                    <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums">
                                        {demo.totalCalories} kcal
                                    </span>
                                </div>
                                <h4 className="font-semibold text-sm text-[var(--text-primary)] line-clamp-2">
                                    {demo.foods.map((f) => f.name).join(', ')}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] pt-2 border-t border-[var(--border-color)]">
                                    <span>P: {demo.totalProtein}g</span>
                                    <span>•</span>
                                    <span>C: {demo.totalCarbs}g</span>
                                    <span>•</span>
                                    <span>F: {demo.totalFat}g</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ANALYSIS RESULT DISPLAY */}
            {result && (
                <div className="space-y-5 animate-slide-up">
                    {/* Header banner indicating status */}
                    <div className="p-4 rounded-2xl border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shrink-0">
                                <LuCheck className="text-base" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                                    {result.isDemo ? 'Demonstration Meal Analysis' : 'Gemini AI Vision Analysis Complete'}
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Review portions and tap &quot;Log This Meal&quot; to save directly into your diary.
                                </p>
                            </div>
                        </div>

                        {/* Timestamp Picker */}
                        <div className="flex items-center gap-2 bg-[var(--bg-card)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] self-start sm:self-auto">
                            <LuClock className="text-xs text-[var(--accent-primary)]" />
                            <input
                                type="datetime-local"
                                value={mealTime}
                                onChange={(e) => setMealTime(e.target.value)}
                                className="bg-transparent text-xs text-[var(--text-primary)] focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Nutrition Card with full editability */}
                    <NutritionCard
                        meal={result}
                        isEditable={true}
                        onMealChange={setResult}
                        showActions={false}
                    />

                    {/* AI Delta Refine Box */}
                    <div className="nutri-card p-4 space-y-2">
                        <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                            <LuSparkles className="text-[var(--accent-primary)] text-xs" />
                            <span>Refine with AI Instructions</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={refinementText}
                                onChange={(e) => setRefinementText(e.target.value)}
                                placeholder="e.g. Actually ate only half the rice, add 1 glass orange juice"
                                className="flex-1 px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                            />
                            <button
                                type="button"
                                onClick={handleRefineWithAI}
                                disabled={refining || !refinementText.trim()}
                                className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity nutri-press"
                            >
                                {refining ? 'Refining...' : 'Update'}
                            </button>
                        </div>
                    </div>

                    {/* Final Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={logMeal}
                            disabled={saved}
                            className={`flex-1 w-full py-4 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all nutri-press ${
                                saved
                                    ? 'bg-[var(--color-success)] text-white'
                                    : 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-[var(--accent-glow)] hover:opacity-95'
                            }`}
                        >
                            {saved ? (
                                <>
                                    <LuCheck className="text-base" />
                                    <span>Meal Logged to Daily Diary!</span>
                                </>
                            ) : (
                                <>
                                    <LuCheck className="text-base" />
                                    <span>Log This Meal</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={reset}
                            className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-elevated)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors nutri-press"
                        >
                            Scan Another Meal
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
