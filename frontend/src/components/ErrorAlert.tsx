import Swal, { type SweetAlertResult } from "sweetalert2";

// ─── Design tokens ────────────────────────────────────────────────────────────
const COLOR = {
  error: { accent: "#ff5252", shadow: "rgba(255,82,82,.18)", text: "#1a0606", bg: "#1a0d0d" },
} as const;

// ─── Private helpers ──────────────────────────────────────────────────────────
function popupClass(): string {
  return [
    "!rounded-2xl",
    "!p-6",
    "!max-w-[480px] !w-[92%]",
    "!overflow-hidden",
    "custom-swal-container",
  ].join(" ");
}

function html(title: string, message: string): string {
  const { accent } = COLOR.error;
  return `
    <style>
      .custom-swal-container {
        display: flex !important;
        flex-direction: column !important;
        gap: 1rem !important;
      }

      .custom-swal-container .swal2-html-container {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 1.25rem !important;
        margin: 0 !important;
        padding: 0 !important;
        text-align: left !important;
      }

      .swal2-icon-custom-fix {
        margin: 0 !important;
        flex-shrink: 0 !important;
        width: 2.5rem !important;
        height: 2.5rem !important;
        min-width: 2.5rem !important;
        border-color: ${accent} !important;
        border-width: 2px !important;
        background: transparent !important;
        display: grid !important;
        place-content: center !important;
      }

      .swal2-icon-custom-fix::before,
      .swal2-icon-custom-fix::after {
        background: transparent !important;
        display: none !important;
      }

      .swal2-icon-custom-fix .swal2-x-mark {
        transform: scale(0.45) !important;
      }

      .swal2-icon-custom-fix .swal2-x-mark-line-left,
      .swal2-icon-custom-fix .swal2-x-mark-line-right {
        background-color: ${accent} !important;
        top: 1.1rem !important;
        width: 1.5rem !important;
      }
    </style>
    <div class="flex flex-col items-start text-left gap-1 min-w-0 flex-1">
      <span class="text-white text-[13px] font-semibold tracking-widest uppercase leading-tight">
        ${title}
      </span>
      <span class="text-white/50 text-[13px] leading-snug wrap-break-word w-full">
        ${message}
      </span>
    </div>`;
}

const ICON_CLASS = "swal2-icon-custom-fix";

// ─── Alert ────────────────────────────────────────────────────────────────────
export class Alert {
  static error(
    message: string,
    title = "Error",
    duration = 4_000
  ): Promise<SweetAlertResult> {
    const theme = COLOR.error;
    return Swal.fire({
      html: html(title, message),
      icon: "error",
      iconColor: theme.accent,
      background: theme.bg,
      showConfirmButton: false,
      timer: duration,
      timerProgressBar: true,
      customClass: {
        popup: popupClass(),
        icon: ICON_CLASS,
        timerProgressBar: `!bg-[${theme.accent}] !h-1 !top-auto !bottom-0`,
      },
      didOpen: (popup) => {
        popup.style.boxShadow = `0 0 28px ${theme.shadow}`;
        popup.style.borderColor = theme.accent;

        const icon = popup.querySelector(".swal2-icon");
        const container = popup.querySelector(".swal2-html-container");
        if (icon && container) container.insertBefore(icon, container.firstChild);
      },
    });
  }

  static close(): void {
    Swal.close();
  }
}