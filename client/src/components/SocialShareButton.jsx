import { useMemo, useState } from "react";
import { Share2, X, Copy, Check, ExternalLink } from "lucide-react";
import { useDarkMode } from "../context/DarkModeContext";

const encode = (value) => encodeURIComponent(value || "");

const buildPlatformLinks = ({ url, title, text }) => {
  const joinedText = text ? `${text} ${url}`.trim() : url;
  return [
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encode(joinedText)}`,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encode(url)}`,
    },
    {
      id: "instagram",
      label: "Instagram",
      href: "https://www.instagram.com/",
      requiresCopy: true,
    },
    {
      id: "x",
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encode(text || title || "Check this out")}&url=${encode(url)}`,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encode(url)}`,
    },
    {
      id: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${encode(url)}&text=${encode(text || title || "Check this out")}`,
    },
    {
      id: "email",
      label: "Email",
      href: `mailto:?subject=${encode(title || "Shared from ScriptBridge")}&body=${encode(`${text || ""}\n\n${url}`.trim())}`,
      openDirect: true,
    },
  ];
};

const safeClipboardWrite = async (value) => {
  if (!value) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall back to document copy command below.
  }

  try {
    const temp = document.createElement("textarea");
    temp.value = value;
    temp.setAttribute("readonly", "true");
    temp.style.position = "absolute";
    temp.style.left = "-9999px";
    document.body.appendChild(temp);
    temp.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(temp);
    return copied;
  } catch {
    return false;
  }
};

const SocialShareButton = ({
  share,
  className = "",
  buttonLabel = "Share",
  iconOnly = false,
  onShared,
}) => {
  const { isDarkMode: dark } = useDarkMode();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [infoText, setInfoText] = useState("");

  const url = share?.url || "";
  const title = share?.title || "Shared from ScriptBridge";
  const text = share?.text || "";
  const payloadText = `${text} ${url}`.trim();
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const platforms = useMemo(() => buildPlatformLinks({ url, title, text }), [url, title, text]);

  const markShared = (platform) => {
    if (typeof onShared === "function") {
      onShared(platform);
    }
  };

  const handleCopy = async () => {
    const ok = await safeClipboardWrite(url);
    if (!ok) {
      setInfoText("Copy failed. Please copy manually.");
      return;
    }
    setCopied(true);
    setInfoText("Link copied.");
    markShared("copy");
    setTimeout(() => setCopied(false), 1800);
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) {
      await handleCopy();
      return;
    }

    try {
      await navigator.share({ title, text, url });
      markShared("native");
      setInfoText("Shared.");
    } catch {
      // User cancelled native share.
    }
  };

  const handlePlatform = async (platform) => {
    if (platform.requiresCopy) {
      const copiedOk = await safeClipboardWrite(payloadText || url);
      if (copiedOk) {
        setInfoText("Text copied. Paste it in Instagram.");
      } else {
        setInfoText("Opened Instagram. Copy/paste the link manually.");
      }
    }

    if (platform.openDirect) {
      window.location.href = platform.href;
    } else {
      window.open(platform.href, "_blank", "noopener,noreferrer,width=680,height=720");
    }
    markShared(platform.id);
  };

  if (!url) return null;

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
          setInfoText("");
        }}
        className={className || `inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition ${dark ? "bg-white/[0.06] border-white/[0.12] text-white/80 hover:bg-white/[0.12]" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
        aria-label={buttonLabel}
      >
        <Share2 size={15} />
        {!iconOnly && <span>{buttonLabel}</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
          <div
            className={`relative w-full max-w-md rounded-2xl border shadow-2xl ${dark ? "bg-[#0d1520] border-white/[0.08]" : "bg-white border-gray-100"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`flex items-center justify-between px-5 py-4 border-b ${dark ? "border-white/[0.08]" : "border-gray-100"}`}>
              <div>
                <p className={`text-sm font-bold ${dark ? "text-white" : "text-gray-900"}`}>Share</p>
                <p className={`text-xs ${dark ? "text-white/45" : "text-gray-500"}`}>Instagram, WhatsApp, LinkedIn, and more</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark ? "bg-white/[0.07] text-white/70" : "bg-gray-100 text-gray-500"}`}
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => handlePlatform(platform)}
                    className={`px-3.5 py-2.5 rounded-xl border text-sm font-semibold text-left transition inline-flex items-center justify-between ${dark ? "bg-white/[0.04] border-white/[0.08] text-white/80 hover:bg-white/[0.08]" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"}`}
                  >
                    <span>{platform.label}</span>
                    <ExternalLink size={13} className={dark ? "text-white/45" : "text-gray-400"} />
                  </button>
                ))}
              </div>

              <div className={`rounded-xl border p-3 ${dark ? "border-white/[0.08] bg-[#0a111a]" : "border-gray-200 bg-gray-50"}`}>
                <p className={`text-[11px] font-semibold mb-2 ${dark ? "text-white/45" : "text-gray-500"}`}>Direct options</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${dark ? "border-white/[0.12] text-white/80 hover:bg-white/[0.08]" : "border-gray-200 text-gray-700 hover:bg-white"}`}
                  >
                    More Apps
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 ${dark ? "border-white/[0.12] text-white/80 hover:bg-white/[0.08]" : "border-gray-200 text-gray-700 hover:bg-white"}`}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy Link"}
                  </button>
                </div>
                <p className={`mt-2 text-[11px] break-all ${dark ? "text-white/35" : "text-gray-500"}`}>{url}</p>
              </div>

              {infoText && (
                <div className={`text-xs font-medium ${dark ? "text-sky-300" : "text-sky-700"}`}>{infoText}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SocialShareButton;