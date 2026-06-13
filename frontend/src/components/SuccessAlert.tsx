import Swal, { type SweetAlertResult } from "sweetalert2";

// ─── Design tokens ────────────────────────────────────────────────────────────
const COLOR = {
  success: { accent: "#00e676", shadow: "rgba(0,230,118,.18)", text: "#062010", bg: "#0d1a12" },
} as const;

// ─── Private helpers ──────────────────────────────────────────────────────────
function popupClass(): string {
  return [
    "!rounded-2xl",
    "!p-6",
    "!max-w-[480px] !w-[92%]",
    "!overflow-hidden",
    "custom-swal-container"
  ].join(" ");
}

function html(title: string, message: string): string {
  const { accent } = COLOR.success;
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
        border-color: ${accent} !important;
        background: transparent !important;
        display: grid !important;
        place-content: center !important;
      }

      .swal2-icon-custom-fix .swal2-success-fix,
      .swal2-icon-custom-fix .swal2-success-circular-line-left,
      .swal2-icon-custom-fix .swal2-success-circular-line-right,
      .swal2-icon-custom-fix::before,
      .swal2-icon-custom-fix::after {
        background: transparent !important;
        display: none !important;
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
export class Alert {
  static success(
    message: string,
    title = "Success",
    duration = 3_000
  ): Promise<SweetAlertResult> {
    const theme = COLOR.success;
    return Swal.fire({
      html: html(title, message),
      icon: "success",
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
      }
    });
  }

  static close(): void {
    Swal.close();
  }
}