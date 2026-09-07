import { useEffect } from "react";

export default function useQuizProtection() {
  useEffect(() => {
    const isEditableElement = (target) => {
      if (!(target instanceof HTMLElement)) return false;

      return (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      );
    };

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      // F12
      if (event.key === "F12") {
        event.preventDefault();
        return;
      }

      // Ctrl + Shift + I/J/C
      if (
        event.ctrlKey &&
        event.shiftKey &&
        ["i", "j", "c"].includes(key)
      ) {
        event.preventDefault();
        return;
      }

      // Ctrl + U
      if (event.ctrlKey && key === "u") {
        event.preventDefault();
        return;
      }

      // Copy / Cut / Paste
      if (
        (event.ctrlKey || event.metaKey) &&
        ["c", "x", "v"].includes(key)
      ) {
        event.preventDefault();
        return;
      }

      // Ctrl + A di luar textarea/input
      if (
        (event.ctrlKey || event.metaKey) &&
        key === "a" &&
        !isEditableElement(event.target)
      ) {
        event.preventDefault();
      }
    };

    const preventDefault = (event) => {
      event.preventDefault();
    };

    const handleSelectStart = (event) => {
      if (!isEditableElement(event.target)) {
        event.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", preventDefault);
    document.addEventListener("cut", preventDefault);
    document.addEventListener("paste", preventDefault);
    document.addEventListener("contextmenu", preventDefault);
    document.addEventListener("dragstart", preventDefault);
    document.addEventListener("selectstart", handleSelectStart);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", preventDefault);
      document.removeEventListener("cut", preventDefault);
      document.removeEventListener("paste", preventDefault);
      document.removeEventListener("contextmenu", preventDefault);
      document.removeEventListener("dragstart", preventDefault);
      document.removeEventListener("selectstart", handleSelectStart);
    };
  }, []);
}