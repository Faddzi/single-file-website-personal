const terminalCursor = document.getElementById("terminal-cursor");

document.addEventListener("mousemove", (e) => {
    // Move cursor
    terminalCursor.style.transform =
        `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;

    // Find what is directly underneath the cursor
    const element = document.elementFromPoint(e.clientX, e.clientY);

    if (!element) return;

    let current = element;
    let background = "transparent";

    // Look up through the elements until we find a real background
    while (current && current !== document.body) {
        const bg = window.getComputedStyle(current).backgroundColor;

        if (
            bg &&
            bg !== "transparent" &&
            bg !== "rgba(0, 0, 0, 0)"
        ) {
            background = bg;
            break;
        }

        current = current.parentElement;
    }

    // Extract RGB
    const match = background.match(/\d+/g);

    if (match && match.length >= 3) {
        const r = parseInt(match[0]);
        const g = parseInt(match[1]);
        const b = parseInt(match[2]);

        // Calculate brightness
        const brightness =
            (r * 299 + g * 587 + b * 114) / 1000;

        // Dark background = light cursor
        // Red background = light cursor
        if (
         brightness < 140 ||
    (r > 120 && r > g * 1.5 && r > b * 1.5)
) {
    terminalCursor.style.color = "#f2f0e9";
 } else {
    terminalCursor.style.color = "#111";
 }
    }
});