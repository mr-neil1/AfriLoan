"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Camera, 
  Video, 
  X, 
  Check, 
  RotateCcw, 
  AlertCircle, 
  ShieldCheck, 
  Upload, 
  Play, 
  Pause,
  Clock
} from "lucide-react";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: "CNI_RECTO" | "CNI_VERSO" | "SELFIE_PHOTO" | "KYC_VIDEO" | "PASSPORT";
  onCaptured: (fileData: string, mediaType: "IMAGE" | "VIDEO", captureSource: "WEBCAM" | "UPLOAD" | "LIVE_RECORDING") => Promise<void>;
}

export default function CameraCaptureModal({
  isOpen,
  onClose,
  documentType,
  onCaptured
}: CameraCaptureModalProps) {
  const [mode, setMode] = useState<"CAMERA" | "UPLOAD">("CAMERA");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedData, setCapturedData] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const isVideoMode = documentType === "KYC_VIDEO";

  const getDocTitle = () => {
    switch (documentType) {
      case "CNI_RECTO": return "Pièce d'Identité - Recto (Face avant)";
      case "CNI_VERSO": return "Pièce d'Identité - Verso (Face arrière)";
      case "SELFIE_PHOTO": return "Photo Selfie de Vivacité";
      case "KYC_VIDEO": return "Vidéo KYC de Vivacité (5-8 secondes)";
      case "PASSPORT": return "Passeport - Page Principale";
      default: return "Document d'identité";
    }
  };

  const getDocGuideline = () => {
    switch (documentType) {
      case "CNI_RECTO": 
        return "Positionnez le recto de votre CNI bien droit dans le cadre. Évitez les reflets de lumière.";
      case "CNI_VERSO": 
        return "Positionnez le verso de votre CNI avec la bande de lecture visible et nette.";
      case "SELFIE_PHOTO": 
        return "Regardez l'objectif, gardez une expression neutre et assurez-vous d'avoir un bon éclairage.";
      case "KYC_VIDEO": 
        return "Appuyez sur Enregistrer. Regardez la caméra, tournez doucement la tête de gauche à droite, puis souriez.";
      case "PASSPORT": 
        return "Cadrez la page avec votre photo et vos informations d'état civil bien lisibles.";
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: documentType === "SELFIE_PHOTO" || documentType === "KYC_VIDEO" ? "user" : "environment"
        },
        audio: isVideoMode
      };
      const userStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(userStream);
      if (videoRef.current) {
        videoRef.current.srcObject = userStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur."
          : "Impossible d'accéder à la caméra. Utilisez l'option 'Importer un fichier'."
      );
      setMode("UPLOAD");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedData(null);
      setRecordingSeconds(0);
      setIsRecording(false);
      setMode("CAMERA");
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, documentType]);

  // Take Snapshot Photo
  const handleTakeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    setCapturedData(dataUrl);
    stopCamera();
  };

  // Record Live Video
  const handleStartVideoRecording = () => {
    if (!stream) return;
    recordedChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const options = { mimeType: "video/webm;codecs=vp8,opus" };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || "video/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setCapturedData(reader.result as string);
        };
        reader.readAsDataURL(blob);
        stopCamera();
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 8) {
            handleStopVideoRecording();
            return 8;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      alert("Erreur lors du démarrage de l'enregistrement vidéo : " + err.message);
    }
  };

  const handleStopVideoRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  // Handle Local File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("Le fichier est trop lourd (maximum 15 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Retake
  const handleRetake = () => {
    setCapturedData(null);
    setRecordingSeconds(0);
    setIsRecording(false);
    startCamera();
  };

  // Submit to Server
  const handleSubmit = async () => {
    if (!capturedData) return;
    setIsSubmitting(true);
    try {
      const mediaType = isVideoMode ? "VIDEO" : "IMAGE";
      const source = mode === "UPLOAD" ? "UPLOAD" : isVideoMode ? "LIVE_RECORDING" : "WEBCAM";
      await onCaptured(capturedData, mediaType, source);
      onClose();
    } catch (err: any) {
      alert("Erreur lors de l'envoi : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#064E29] flex items-center justify-center">
              {isVideoMode ? <Video className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">{getDocTitle()}</h2>
              <p className="text-[11px] font-semibold text-slate-500">Vérification de sécurité KYC AfriLoan</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Instructions banner */}
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#064E29] shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-950 leading-relaxed font-medium">
              {getDocGuideline()}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => { setMode("CAMERA"); startCamera(); }}
              className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                mode === "CAMERA" ? "bg-white text-[#064E29] shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {isVideoMode ? <Video className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
              <span>{isVideoMode ? "Enregistrer en direct" : "Prendre une photo"}</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode("UPLOAD"); stopCamera(); }}
              className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                mode === "UPLOAD" ? "bg-white text-[#064E29] shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importer un fichier</span>
            </button>
          </div>

          {/* Viewport: Live Camera OR Preview */}
          <div className="relative aspect-[4/3] w-full rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center shadow-inner">
            
            {/* 1. Preview of captured photo/video */}
            {capturedData ? (
              isVideoMode ? (
                <video 
                  src={capturedData} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain"
                />
              ) : (
                <img 
                  src={capturedData} 
                  alt="Aperçu document" 
                  className="w-full h-full object-contain"
                />
              )
            ) : mode === "CAMERA" ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${documentType === "SELFIE_PHOTO" || documentType === "KYC_VIDEO" ? "scale-x-[-1]" : ""}`}
                />

                {/* Framing guides overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                  {documentType === "CNI_RECTO" || documentType === "CNI_VERSO" || documentType === "PASSPORT" ? (
                    <div className="w-full h-full border-2 border-dashed border-emerald-400/90 rounded-2xl flex flex-col justify-between p-3 bg-slate-950/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                      <div className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg self-start">
                        Cadre CNI / Passeport
                      </div>
                      <div className="text-[10px] text-center text-white/80 font-medium">
                        Centrez votre pièce d'identité ici
                      </div>
                    </div>
                  ) : (
                    <div className="w-56 h-72 border-2 border-dashed border-emerald-400/90 rounded-[50%] flex items-center justify-center bg-slate-950/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                      <div className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-full">
                        Placez votre visage ici
                      </div>
                    </div>
                  )}
                </div>

                {/* Video recording indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 bg-rose-600 text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-black animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                    <span>Enregistrement : 00:0{recordingSeconds} / 00:08</span>
                  </div>
                )}
              </>
            ) : (
              /* Upload view */
              <div className="text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 bg-[#064E29] hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-md">
                    <span>Choisir un fichier sur l'appareil</span>
                    <input
                      type="file"
                      accept={isVideoMode ? "video/*" : "image/*,application/pdf"}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {isVideoMode ? "Format MP4, WebM (max 15 Mo)" : "Format JPG, PNG, PDF (max 10 Mo)"}
                  </p>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Action Trigger Buttons */}
          <div className="pt-2">
            {capturedData ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reprendre</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 transition-all"
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Valider & Transmettre</span>
                    </>
                  )}
                </button>
              </div>
            ) : mode === "CAMERA" ? (
              isVideoMode ? (
                isRecording ? (
                  <button
                    type="button"
                    onClick={handleStopVideoRecording}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Arrêter l'enregistrement ({recordingSeconds}s)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartVideoRecording}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Démarrer l'enregistrement KYC (5-8s)</span>
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={handleTakeSnapshot}
                  className="w-full py-4 bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capturer la photo maintenant</span>
                </button>
              )
            ) : null}
          </div>

        </div>

      </div>
    </div>
  );
}
