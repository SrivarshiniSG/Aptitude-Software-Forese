import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import beepSound from "../assets/beep.js";

// Simple Modal Component
const WarningModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h3 style={{ marginTop: 0 }}>Warning</h3>
        <p>{message}</p>
        <button 
          onClick={onClose}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
};

function useTabVisibility({ onSubmitTest }) {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [alertShown, setAlertShown] = useState(false);
  const [audio] = useState(new Audio(beepSound));
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const navigate = useNavigate();

  const handleModalClose = () => {
    setShowModal(false);
    if (tabSwitchCount >= 2) {
      onSubmitTest().then(() => {
        navigate("/feedback?t=tabswitch");
      });
    }
  };

  useEffect(() => {
    if (typeof document.hidden === "undefined") {
      console.log("Page Visibility API is not supported in this browser.");
      return;
    }

    console.log("Tab and window detection initialized");

    audio.preload = "auto";
    audio.volume = 1.0;

    const playBeep = async () => {
      try {
        audio.currentTime = 0;
        await audio.play();
      } catch (error) {
        console.error("Error playing beep:", error);
      }
    };

    const handleSwitch = async () => {
      console.log("Tab/Window switched away!");
      setTabSwitchCount((prevCount) => {
        const newCount = prevCount + 1;
        console.log("Switch count:", newCount);

        playBeep();

        if (newCount === 1) {
          setModalMessage("Warning: You switched away from the test! This is your first warning.");
          setShowModal(true);
          setAlertShown(true);
        } else if (newCount >= 3) {
          setModalMessage("You have switched away twice. The test will now end.");
          setShowModal(true);
        }
        return newCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleSwitch();
      }
    };

    const handleWindowBlur = () => {
      handleSwitch();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    const initAudio = () => {
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch((error) => console.error("Error initializing audio:", error));
      document.removeEventListener("click", initAudio);
    };
    document.addEventListener("click", initAudio);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("click", initAudio);
      audio.pause();
      audio.src = "";
      console.log("Tab and window detection cleanup");
    };
  }, [alertShown, navigate, audio, onSubmitTest, tabSwitchCount]);

  return { tabSwitchCount, showModal, modalMessage, handleModalClose };
}

const TabDetection = ({ onSubmitTest }) => {
  const { tabSwitchCount, showModal, modalMessage, handleModalClose } = useTabVisibility({ onSubmitTest });

  return (
    <>
      <div style={{ display: "none" }}>
        <span>{tabSwitchCount}</span>
      </div>
      <WarningModal 
        isOpen={showModal} 
        message={modalMessage} 
        onClose={handleModalClose}
      />
    </>
  );
};

export default TabDetection;
