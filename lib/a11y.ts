// Accessibility utilities

export const A11Y = {
  // ARIA label helpers
  ariaLabel: {
    addToList: "Add to watchlist",
    removeFromList: "Remove from watchlist",
    closeModal: "Close dialog",
    openMenu: "Open menu",
    loading: "Loading content",
    error: "Error occurred",
    success: "Success",
  },

  // Keyboard navigation helpers
  isEnterOrSpace: (e: React.KeyboardEvent) => {
    return e.key === "Enter" || e.key === " ";
  },

  // Focus management
  focusTrap: (container: HTMLElement | null) => {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'a, button, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    container.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    });
  },

  // Announce to screen readers
  announce: (message: string, priority: "polite" | "assertive" = "polite") => {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("class", "visually-hidden");
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  // Skip link for keyboard navigation
  createSkipLink: (targetId: string) => {
    const link = document.createElement("a");
    link.href = `#${targetId}`;
    link.textContent = "Skip to main content";
    link.className = "skip-link";
    return link;
  },
};

// CSS for skip link
export const skipLinkStyles = `
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    z-index: 100;
  }
  
  .skip-link:focus {
    top: 0;
  }
`;

// Semantic HTML helpers
export const semanticRoles = {
  main: "main",
  navigation: "navigation",
  complementary: "complementary",
  contentinfo: "contentinfo",
  region: "region",
};

// Color contrast helper
export function meetsContrastRatio(color1: string, color2: string): boolean {
  // Simplified check - in production, use a proper library
  return true; // Placeholder
}
