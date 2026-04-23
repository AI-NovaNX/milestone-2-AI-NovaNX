(() => {
  const OPEN_SELECTOR = "[data-mobile-menu-open]";
  const CLOSE_SELECTOR = "[data-mobile-menu-close]";
  const MENU_TEMPLATE = `
<div
  id="mobile-menu-overlay"
  class="fixed inset-0 z-120 hidden md:hidden"
  role="dialog"
  aria-modal="true"
  aria-label="Mobile navigation"
>
  <div
    class="absolute inset-0 bg-[rgba(5,1,13,0.86)] backdrop-blur-[2px]"
    data-mobile-menu-close
  ></div>

  <div class="relative z-10 flex h-full w-full flex-col">
    <header class="header-shell">
      <div class="header-noise"></div>
      <div class="relative z-10 flex min-h-20.5 items-center justify-between px-4 py-3">
        <a
          href="indeks.html"
          aria-label="REVOFUN Home"
          data-logo-home
          class="header-brand max-w-[16.8rem]"
        >
          <img
            src="assets/REVOFUN-logo.png"
            alt="REVOFUN"
            class="header-logo select-none"
          />
        </a>

        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.28)] bg-[rgba(18,6,42,0.45)] shadow-[0_8px_18px_rgba(8,3,20,0.45)]"
          data-mobile-menu-close
          aria-label="Close menu"
        >
          <img
            src="assets/x-close.png"
            alt=""
            aria-hidden="true"
            class="h-5.5 w-5.5"
          />
        </button>
      </div>
    </header>

    <nav
      class="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center"
      aria-label="Mobile navigation links"
    >
      <a
        href="indeks.html"
        class="inline-flex min-w-52 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.28)] bg-[rgba(22,8,52,0.45)] px-6 py-3 font-[Orbitron] text-[1.02rem] font-extrabold tracking-[0.08em] uppercase text-white no-underline shadow-[0_10px_20px_rgba(8,3,20,0.4)]"
      >
        Home
      </a>
      <a
        href="indeks.html#games"
        class="inline-flex min-w-52 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.28)] bg-[rgba(22,8,52,0.45)] px-6 py-3 font-[Orbitron] text-[1.02rem] font-extrabold tracking-[0.08em] uppercase text-white no-underline shadow-[0_10px_20px_rgba(8,3,20,0.4)]"
      >
        Games
      </a>
      <a
        href="about-us.html"
        class="inline-flex min-w-52 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.28)] bg-[rgba(22,8,52,0.45)] px-6 py-3 font-[Orbitron] text-[1.02rem] font-extrabold tracking-[0.08em] uppercase text-white no-underline shadow-[0_10px_20px_rgba(8,3,20,0.4)]"
      >
        About
      </a>
    </nav>
  </div>
</div>
`;

  const bindMenu = () => {
    const overlay = document.getElementById("mobile-menu-overlay");
    const openButtons = document.querySelectorAll(OPEN_SELECTOR);

    if (!overlay || openButtons.length === 0) {
      return;
    }

    const closeMenu = () => {
      overlay.classList.add("hidden");
      document.body.style.overflow = "";
      openButtons.forEach((button) => {
        button.setAttribute("aria-expanded", "false");
      });
    };

    const openMenu = () => {
      overlay.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      openButtons.forEach((button) => {
        button.setAttribute("aria-expanded", "true");
      });
    };

    openButtons.forEach((button) => {
      button.addEventListener("click", openMenu);
    });

    overlay.querySelectorAll(CLOSE_SELECTOR).forEach((button) => {
      button.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !overlay.classList.contains("hidden")) {
        closeMenu();
      }
    });

    overlay.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
  };

  const loadMenu = async () => {
    if (document.getElementById("mobile-menu-overlay")) {
      bindMenu();
      return;
    }

    try {
      const response = await fetch("mobile-menu.html", { cache: "no-store" });
      if (response.ok) {
        const menuHtml = await response.text();
        document.body.insertAdjacentHTML("beforeend", menuHtml);
        bindMenu();
        return;
      }
    } catch {
      // Fall through to template fallback.
    }

    document.body.insertAdjacentHTML("beforeend", MENU_TEMPLATE);
    bindMenu();
  };

  document.addEventListener("click", (event) => {
    const logoLink = event.target.closest("[data-logo-home]");
    if (!logoLink) {
      return;
    }

    if (window.matchMedia("(max-width: 767.98px)").matches) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  document.addEventListener("DOMContentLoaded", loadMenu);
})();
