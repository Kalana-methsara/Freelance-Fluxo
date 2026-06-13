import Swal, { type SweetAlertResult } from "sweetalert2";

// ─── Design tokens ────────────────────────────────────────────────────────────

const COLOR = {
  success: { accent: "#00e676", shadow: "rgba(0,230,118,.18)", text: "#062010", bg: "#0d1a12" },
  error:   { accent: "#ff3b30", shadow: "rgba(255,59,48,.18)",  text: "#ffffff", bg: "#1a0d0d" },
  warning: { accent: "#ffaa00", shadow: "rgba(255,170,0,.18)",  text: "#1a0e00", bg: "#1a1100" },
  confirm: { accent: "#7c6df0", shadow: "rgba(124,109,240,.18)",text: "#ffffff", bg: "#110e1f" },
  loading: { accent: "#00bfff", shadow: "rgba(0,191,255,.18)",  text: "#001a2e", bg: "#00111a" },
} as const;

type Variant = keyof typeof COLOR;

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

function html(v: Variant, title: string, message: string): string {
  const { accent } = COLOR[v];
  return `
    <style>
      /* Force the native icon and this HTML content container to sit side-by-side */
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

      /* Fix and cleanly isolate the icon container sizing */
      .swal2-icon-custom-fix {
        margin: 0 !important;
        flex-shrink: 0 !important;
        border-color: ${accent} !important;
        background: transparent !important;
        display: grid !important;
        place-content: center !important;
      }

      /* Clean up SWAL's internal layout masks causing distortion */
      .swal2-icon-custom-fix .swal2-success-fix,
      .swal2-icon-custom-fix .swal2-success-circular-line-left,
      .swal2-icon-custom-fix .swal2-success-circular-line-right,
      .swal2-icon-custom-fix .swal2-x-mark,
      .swal2-icon-custom-fix::before,
      .swal2-icon-custom-fix::after {
        background: transparent !important;
        display: none !important;
      }

      /* Manual internal fix for the error X lines to render perfectly inside the circle */
      .swal2-icon-custom-fix.swal2-error [class^='swal2-x-mark-line'] {
        display: block !important;
        position: absolute !important;
        top: 23px !important;
        height: 5px !important;
        width: 47px !important;
        border-radius: 2px !important;
        background-color: ${accent} !important;
      }
      .swal2-icon-custom-fix.swal2-error .swal2-x-mark-line-left {
        left: 17px !important;
        transform: rotate(45deg) !important;
      }
      .swal2-icon-custom-fix.swal2-error .swal2-x-mark-line-right {
        right: 16px !important;
        transform: rotate(-45deg) !important;
      }
    </style>
    <div class="flex flex-col items-start text-left gap-1 min-w-0 flex-1">
      <span class="text-white text-[13px] font-semibold tracking-[.1em] uppercase leading-tight">
        ${title}
      </span>
      <span class="text-white/50 text-[13px] leading-snug break-words w-full">
        ${message}
      </span>
    </div>`;
}

function actionBtn(bg: string, text: string, hover: string, extra = ""): string {
  return [
    `!bg-[${bg}] !text-[${text}] hover:!bg-[${hover}]`,
    "!text-[11px] !font-semibold !tracking-[.06em] !uppercase",
    "!px-5 !py-2.5 !rounded-lg",
    "!border-none !outline-none !shadow-none",
    "!transition-colors !duration-150",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

function ghostBtn(): string {
  return [
    "!bg-transparent hover:!bg-white/5",
    "!text-[11px] !font-semibold !tracking-[.06em] !uppercase !text-white/40",
    "!px-5 !py-2.5 !rounded-lg",
    "!border !border-white/[.12]",
    "!transition-colors !duration-150",
  ].join(" ");
}

const ICON_CLASS = "swal2-icon-custom-fix";

// ─── Alert ────────────────────────────────────────────────────────────────────

export class Alert {
  static success(
    message: string,
    title = "Success",
    duration = 3_000
  ): Promise<SweetAlertResult> {
    const theme = COLOR.success;
    return Swal.fire({
      html: html("success", title, message),
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
        // Move the icon inside the HTML container for side-by-side flex layout
        const icon = popup.querySelector(".swal2-icon");
        const container = popup.querySelector(".swal2-html-container");
        if (icon && container) container.insertBefore(icon, container.firstChild);
      }
    });
  }

 

  static async warning(
    message: string,
    title = "Warning",
    confirmText = "Continue"
  ): Promise<boolean> {
    const theme = COLOR.warning;
    const result = await Swal.fire({
      html: html("warning", title, message),
      icon: "warning",
      iconColor: theme.accent,
      background: theme.bg,
      showConfirmButton: true,
      confirmButtonText: confirmText,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      customClass: {
        popup: popupClass(),
        icon: ICON_CLASS,
        confirmButton: actionBtn(theme.accent, theme.text, "#e65100"),
        cancelButton: ghostBtn(),
        actions: "!gap-2 !m-0 !p-0 !w-full !justify-end",
      },
      didOpen: (popup) => {
        popup.style.boxShadow = `0 0 28px ${theme.shadow}`;
        popup.style.borderColor = theme.accent;
        const icon = popup.querySelector(".swal2-icon");
        const container = popup.querySelector(".swal2-html-container");
        if (icon && container) container.insertBefore(icon, container.firstChild);
      }
    });
    return result.isConfirmed;
  }

  static async confirm(
    message: string,
    title = "Are you sure?",
    confirmText = "Confirm",
    cancelText = "Cancel"
  ): Promise<boolean> {
    const theme = COLOR.confirm;
    const result = await Swal.fire({
      html: html("confirm", title, message),
      icon: "question",
      iconColor: theme.accent,
      background: theme.bg,
      showConfirmButton: true,
      confirmButtonText: confirmText,
      showCancelButton: true,
      cancelButtonText: cancelText,
      reverseButtons: true,
      customClass: {
        popup: popupClass(),
        icon: ICON_CLASS,
        confirmButton: actionBtn(theme.accent, theme.text, "#5c4fd6"),
        cancelButton: ghostBtn(),
        actions: "!gap-2 !m-0 !p-0 !w-full !justify-end",
      },
      didOpen: (popup) => {
        popup.style.boxShadow = `0 0 28px ${theme.shadow}`;
        popup.style.borderColor = theme.accent;
        const icon = popup.querySelector(".swal2-icon");
        const container = popup.querySelector(".swal2-html-container");
        if (icon && container) container.insertBefore(icon, container.firstChild);
      }
    });
    return result.isConfirmed;
  }

  static loading(
    message: string,
    title = "Please wait"
  ): Promise<SweetAlertResult> {
    const theme = COLOR.loading;
    return Swal.fire({
      html: html("loading", title, message),
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      background: theme.bg,
      customClass: {
        popup: popupClass(),
        icon: ICON_CLASS,
      },
      didOpen: (popup) => {
        popup.style.boxShadow = `0 0 28px ${theme.shadow}`;
        popup.style.borderColor = theme.accent;
        const icon = popup.querySelector(".swal2-icon");
        const container = popup.querySelector(".swal2-html-container");
        if (icon && container) container.insertBefore(icon, container.firstChild);
        Swal.showLoading(Swal.getIcon() as HTMLButtonElement);
      },
    });
  }

  static updateLoadingMessage(message: string, title = "Please wait"): void {
    const container = Swal.getHtmlContainer();
    if (container) {
      // Retain the appended icon element if it exists during message updates
      const icon = container.querySelector(".swal2-icon");
      container.innerHTML = html("loading", title, message);
      if (icon) container.insertBefore(icon, container.firstChild);
    }
  }

  static close(): void {
    Swal.close();
  }
}