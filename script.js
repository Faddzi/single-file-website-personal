const terminalCursor = document.getElementById("terminal-cursor");
const cursorMedia = window.matchMedia("(hover: hover) and (pointer: fine)");
let cursorFrame = 0;
let cursorX = 0;
let cursorY = 0;

function renderCursor() {
    terminalCursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    cursorFrame = 0;
}

function updateCursor(event) {
    if (!cursorMedia.matches || event.pointerType === "touch") return;

    cursorX = event.clientX;
    cursorY = event.clientY;

    document.body.classList.add("cursor-ready");
    document.body.classList.toggle(
        "cursor-over-control",
        event.target instanceof Element && Boolean(event.target.closest("a, button, [role='button']"))
    );

    if (!cursorFrame) {
        cursorFrame = window.requestAnimationFrame(renderCursor);
    }
}

window.addEventListener("pointermove", updateCursor, { passive: true });

cursorMedia.addEventListener("change", (event) => {
    if (!event.matches) {
        document.body.classList.remove("cursor-ready", "cursor-over-control");
    }
});

const copyEmailButton = document.querySelector(".copy-email");
const copyFeedback = document.querySelector(".copy-feedback");

copyEmailButton?.addEventListener("click", async () => {
    const emailAddress = copyEmailButton.dataset.email;

    try {
        await navigator.clipboard.writeText(emailAddress);
        copyEmailButton.textContent = "Address copied";
        copyFeedback.textContent = `${emailAddress} copied to clipboard.`;
    } catch {
        copyFeedback.textContent = `Copy failed — ${emailAddress}`;
    }

    window.setTimeout(() => {
        copyEmailButton.textContent = "Copy address";
        copyFeedback.textContent = "";
    }, 2200);
});
