/**
 * Settings UI Component - Vanilla JavaScript
 * Structured nested settings: Profile, Account, Privacy, Security
 * Syncs with backend API
 */

class PrivacySettingsUI {
  constructor(containerSelector, darkMode = true, userId = null, apiService = null) {
    this.container =
      typeof containerSelector === "string"
        ? document.querySelector(containerSelector)
        : containerSelector;

    this.darkMode = darkMode;
    this.currentPanel = "main";
    this.storageKey = "profileSettingsUIState";
    this.userId = userId;
    this.api = apiService;
    this.isSaving = false;
    this.boundPanelClickHandler = null;
    this.noticeTimer = null;

    this.state = this.getInitialState();

    this.loadState();
    this.init();
  }

  getInitialState() {
    return {
      accountEmail: "",
      emailVerified: false,
      requestVerification: false,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      profileVisibility: "public",
      messagingPermissions: "everyone",
      showOnlineStatus: true,
      profileInfoVisibility: {
        email: "hidden",
        phone: "hidden",
        bio: "public",
      },
      allowAnalytics: true,
      enableTwoFactor: false,
      blockedUsers: [],
    };
  }

  init() {
    if (!this.container) return;
    this.injectStyles();
    this.render();
    this.attachEventListeners();
  }

  loadState() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      this.state = {
        ...this.state,
        ...parsed,
        profileInfoVisibility: {
          ...this.state.profileInfoVisibility,
          ...(parsed.profileInfoVisibility || {}),
        },
      };
    } catch (err) {
      console.warn("Failed to load saved settings state", err);
    }
  }

  saveState() {
    // Always save to localStorage for offline support
    localStorage.setItem(this.storageKey, JSON.stringify(this.state));

    // Sync profile updates to backend if we have userId and api service
    if (this.userId && this.api && !this.isSaving) {
      this.syncToBackend();
    }
  }

  async syncToBackend() {
    if (this.isSaving || !this.userId || !this.api) return;
    
    try {
      this.isSaving = true;
      
      // Prepare update payload for settings (privacy, account, security)
      const updatePayload = {
        isPrivate: this.state.profileVisibility === "private",
      };

      // Call backend API to update settings
      await this.api.put(`/users/settings`, updatePayload);
      
    } catch (error) {
      console.error("Failed to sync settings to backend:", error);
      // Silently fail - data is still saved locally
    } finally {
      this.isSaving = false;
    }
  }

  getThemeClasses() {
    return {
      text: this.darkMode ? "text-white" : "text-gray-900",
      textSecondary: this.darkMode ? "text-white/60" : "text-gray-600",
      textMuted: this.darkMode ? "text-white/40" : "text-gray-500",
      shell: this.darkMode
        ? "bg-[#0d1829] border-white/10"
        : "bg-white border-gray-200 shadow-sm",
      card: this.darkMode
        ? "bg-white/5 border-white/10 hover:bg-white/10"
        : "bg-gray-50 border-gray-200 hover:bg-gray-100",
      input: this.darkMode
        ? "bg-white/10 border-white/20 text-white placeholder-white/40"
        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400",
      primaryButton: this.darkMode
        ? "bg-[#1e3a5f] text-white hover:bg-[#274a72]"
        : "bg-[#1e3a5f] text-white hover:bg-[#284d78]",
      subtleButton: this.darkMode
        ? "bg-white/10 text-white/80 hover:bg-white/15"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200",
    };
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = "";
    if (this.currentPanel === "main") {
      this.renderMainPanel();
      return;
    }
    this.renderSubPanel();
  }

  renderMainPanel() {
    const theme = this.getThemeClasses();
    const categories = [
      {
        id: "account",
        title: "Account Settings",
        desc: "Email, password, verification status and request",
      },
      {
        id: "privacy",
        title: "Privacy Settings",
        desc: "Visibility, online status and data",
      },
      {
        id: "security",
        title: "Security Settings",
        desc: "Password actions, two-factor auth and session controls",
      },
    ];

    this.container.innerHTML = `
      <div class="settings-ui-root ${this.darkMode ? "settings-ui-dark" : "settings-ui-light"} rounded-2xl border overflow-hidden transition-all ${theme.shell}">
        <div class="p-4 md:p-6">
          <div class="mb-4">
            <h2 class="text-lg font-bold ${theme.text}">Settings</h2>
            <p class="text-xs mt-1 ${theme.textMuted}">Manage your profile, account, privacy and security in one place.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            ${categories
              .map(
                (cat) => `
              <button
                class="settings-category-btn text-left rounded-xl border p-3.5 transition-all duration-200 group ${theme.card}"
                data-panel="${cat.id}"
                type="button"
              >
                <div class="flex items-start justify-between gap-2 mb-1">
                  <p class="text-sm font-semibold ${theme.text}">${cat.title}</p>
                  <span class="text-xs transition-transform group-hover:translate-x-1 ${theme.textSecondary}">-></span>
                </div>
                <p class="text-xs leading-relaxed ${theme.textSecondary}">${cat.desc}</p>
              </button>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  renderSubPanel() {
    const theme = this.getThemeClasses();
    this.container.innerHTML = `
      <div class="settings-ui-root ${this.darkMode ? "settings-ui-dark" : "settings-ui-light"} rounded-2xl border overflow-hidden transition-all ${theme.shell}">
        <div class="p-4 md:p-6">
          <div class="flex items-center gap-2 mb-4">
            <button
              class="settings-back-btn px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${theme.subtleButton}"
              type="button"
              aria-label="Back"
            >
              <- Back
            </button>
            <h2 class="text-base font-bold ${theme.text}" id="settings-panel-title"></h2>
          </div>

          <div id="settings-feedback" aria-live="polite" class="mb-3"></div>
          <div id="settings-panel-content"></div>
        </div>
      </div>
    `;

    const title = this.container.querySelector("#settings-panel-title");
    const content = this.container.querySelector("#settings-panel-content");
    title.textContent = this.getPanelTitle();
    content.innerHTML = this.getPanelContent();

    const backBtn = this.container.querySelector(".settings-back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", () => this.goToPanel("main"));
    }

    this.attachPanelEventListeners();
  }

  getPanelTitle() {
    const map = {
      account: "Account Settings",
      privacy: "Privacy Settings",
      security: "Security Settings",
    };
    return map[this.currentPanel] || "Settings";
  }

  getPanelContent() {
    switch (this.currentPanel) {
      case "account":
        return this.renderAccountPanel();
      case "privacy":
        return this.renderPrivacyPanel();
      case "security":
        return this.renderSecurityPanel();
      default:
        return "";
    }
  }

  renderAccountPanel() {
    const theme = this.getThemeClasses();

    return `
      <div class="space-y-3.5 animate-fade-in">
        <div>
          <label class="text-xs font-semibold uppercase tracking-wider mb-1.5 block ${theme.textMuted}">Email</label>
          <input class="settings-input w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all ${theme.input}" data-field="accountEmail" type="email" value="${this.escapeValue(this.state.accountEmail)}" placeholder="email@example.com" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-semibold uppercase tracking-wider mb-1.5 block ${theme.textMuted}">Current Password</label>
            <div class="settings-password-wrap">
              <input class="settings-input w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all ${theme.input}" data-field="currentPassword" type="password" placeholder="Enter current password" />
              <button type="button" class="settings-password-toggle" data-target-field="currentPassword" aria-label="Show password">
                ${this.getPasswordToggleIcon(false)}
              </button>
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase tracking-wider mb-1.5 block ${theme.textMuted}">New Password</label>
            <div class="settings-password-wrap">
              <input class="settings-input w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all ${theme.input}" data-field="newPassword" type="password" placeholder="Enter new password" />
              <button type="button" class="settings-password-toggle" data-target-field="newPassword" aria-label="Show password">
                ${this.getPasswordToggleIcon(false)}
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-semibold uppercase tracking-wider mb-1.5 block ${theme.textMuted}">Confirm Password</label>
            <div class="settings-password-wrap">
              <input class="settings-input w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all ${theme.input}" data-field="confirmPassword" type="password" placeholder="Confirm password" />
              <button type="button" class="settings-password-toggle" data-target-field="confirmPassword" aria-label="Show password">
                ${this.getPasswordToggleIcon(false)}
              </button>
            </div>
          </div>
        </div>

        <div class="rounded-xl border p-3 ${this.darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}">
          <div class="flex items-center justify-between gap-3 mb-2">
            <p class="text-sm font-semibold ${theme.text}">Account Verification</p>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-md ${this.state.emailVerified ? (this.darkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-700") : (this.darkMode ? "bg-amber-500/20 text-amber-400" : "bg-amber-50 text-amber-700")}">
              ${this.state.emailVerified ? "Verified" : "Not Verified"}
            </span>
          </div>
          <button type="button" data-action="requestVerification" class="settings-action-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${theme.subtleButton}">
            Request Verification
          </button>
        </div>

        <div class="rounded-xl border p-4 ${this.darkMode ? "border-red-500/30 bg-red-500/10" : "border-red-200 bg-red-50"}">
          <div class="mb-3">
            <p class="text-sm font-semibold ${this.darkMode ? "text-red-400" : "text-red-700"}">Danger Zone</p>
            <p class="text-xs mt-1 ${this.darkMode ? "text-red-300/70" : "text-red-600"}">Permanently delete your account and all associated data</p>
          </div>
          <button type="button" data-action="deleteAccount" class="settings-action-btn px-4 py-2 rounded-lg text-sm font-semibold transition-all ${this.darkMode ? "bg-red-500/30 text-red-300 hover:bg-red-500/40 border border-red-500/40" : "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"}">
            Delete Account
          </button>
        </div>

        <div class="flex items-center justify-end">
          <button type="button" data-action="saveAccount" class="settings-action-btn px-4 py-2 rounded-lg text-sm font-semibold transition-all ${theme.primaryButton}">Save Account</button>
        </div>
      </div>
    `;
  }

  renderPrivacyPanel() {
    const theme = this.getThemeClasses();

    return `
      <div class="space-y-3.5 animate-fade-in">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-semibold uppercase tracking-wider mb-1.5 block ${theme.textMuted}">Profile Visibility</label>
            <select class="settings-select w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all ${theme.input}" data-field="profileVisibility">
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="only_me">Only Me</option>
            </select>
          </div>

          <div>
            <label class="text-xs font-semibold uppercase tracking-wider mb-1.5 block ${theme.textMuted}">Messaging</label>
            <select class="settings-select w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all ${theme.input}" data-field="messagingPermissions">
              <option value="everyone">Everyone</option>
              <option value="followers_only">Followers Only</option>
              <option value="no_one">No One</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          ${this.renderVisibilityCard("Email Visibility", "email", ["hidden", "public"])}
          ${this.renderVisibilityCard("Phone Visibility", "phone", ["hidden", "public"])}
          ${this.renderVisibilityCard("Bio Visibility", "bio", ["private", "public"])}
        </div>

        ${this.renderToggleRow("showOnlineStatus", "Show Online Status", "Let others see when you are active")}
        ${this.renderToggleRow("allowAnalytics", "Allow Analytics", "Share anonymous usage to improve experience")}

        <div class="flex items-center justify-end">
          <button type="button" data-action="savePrivacy" class="settings-action-btn px-4 py-2 rounded-lg text-sm font-semibold transition-all ${theme.primaryButton}">Save Privacy</button>
        </div>
      </div>
    `;
  }

  renderSecurityPanel() {
    const theme = this.getThemeClasses();

    return `
      <div class="space-y-3.5 animate-fade-in">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button type="button" data-action="changePassword" class="settings-action-btn rounded-xl border px-4 py-2.5 text-sm font-semibold text-left transition-all ${this.darkMode ? "border-blue-500/40 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25" : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"}">
            Change Password
          </button>

          <button type="button" data-action="logoutDevices" class="settings-action-btn rounded-xl border px-4 py-2.5 text-sm font-semibold text-left transition-all ${this.darkMode ? "border-orange-500/40 bg-orange-500/15 text-orange-400 hover:bg-orange-500/25" : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"}">
            Logout From All Devices
          </button>
        </div>

        ${this.renderToggleRow("enableTwoFactor", "Two-Factor Authentication", "Require an extra verification step on login")}

        <div class="rounded-xl border p-3 ${this.darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}">
          <p class="text-xs leading-relaxed ${theme.textSecondary}">
            Security actions in this panel are UI-only for now. Connect these controls to your backend endpoints when ready.
          </p>
        </div>
      </div>
    `;
  }

  renderVisibilityCard(title, field, options) {
    const theme = this.getThemeClasses();
    return `
      <div>
        <label class="text-xs font-semibold uppercase tracking-wider mb-1.5 block ${theme.textMuted}">${title}</label>
        <select class="settings-select w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all ${theme.input}" data-field="${field}">
          ${options.map((opt) => `<option value="${opt}">${opt === "hidden" ? "Hidden" : opt === "public" ? "Public" : "Private"}</option>`).join("")}
        </select>
      </div>
    `;
  }

  getPasswordToggleIcon(isVisible) {
    if (isVisible) {
      return `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
    } else {
      return `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L3.596 3.596m16.807 16.807L9.404 9.404m0 0L3.596 3.596m16.807 16.807l-6.208-6.208"></path></svg>`;
    }
  }

  renderToggleRow(field, label, desc) {
    const isOn = !!this.state[field];
    return `
      <div class="rounded-xl border p-3 ${this.darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}">
        <div class="flex items-center justify-between gap-3">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold ${this.darkMode ? "text-white/85" : "text-gray-900"}">${label}</p>
            <p class="text-xs mt-0.5 ${this.darkMode ? "text-white/45" : "text-gray-500"}">${desc}</p>
          </div>
          <button type="button" class="settings-toggle relative w-10 h-5.5 rounded-full transition-all duration-300 ${isOn ? (this.darkMode ? "bg-emerald-500/40" : "bg-emerald-100") : (this.darkMode ? "bg-white/15" : "bg-gray-200")}" data-field="${field}">
            <span class="absolute top-[3px] left-[3px] w-4 h-4 rounded-full transition-all duration-300 ${isOn ? (this.darkMode ? "bg-emerald-400" : "bg-emerald-500") + " translate-x-[20px]" : (this.darkMode ? "bg-white/60" : "bg-white")}"></span>
          </button>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const categoryBtns = this.container.querySelectorAll(".settings-category-btn");
    categoryBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.goToPanel(btn.dataset.panel));
    });
  }

  attachPanelEventListeners() {
    if (this.boundPanelClickHandler) {
      this.container.removeEventListener("click", this.boundPanelClickHandler);
    }

    this.boundPanelClickHandler = (event) => {
      const actionBtn = event.target.closest(".settings-action-btn");
      if (actionBtn && this.container.contains(actionBtn)) {
        event.preventDefault();
        event.stopPropagation();
        this.handleAction(actionBtn.dataset.action);
      }
    };

    this.container.addEventListener("click", this.boundPanelClickHandler);

  }

  showNotice(message, type = "info") {
    const text = String(message || "").trim();
    if (!text) return;

    const toneClass =
      type === "error"
        ? (this.darkMode
            ? "bg-red-500/15 border-red-400/35 text-red-200"
            : "bg-red-50 border-red-200 text-red-700")
        : type === "success"
          ? (this.darkMode
              ? "bg-emerald-500/15 border-emerald-400/35 text-emerald-200"
              : "bg-emerald-50 border-emerald-200 text-emerald-700")
          : (this.darkMode
              ? "bg-blue-500/15 border-blue-400/35 text-blue-200"
              : "bg-blue-50 border-blue-200 text-blue-700");

    const messageHtml = `<div role="status" class="rounded-xl border px-3 py-2.5 text-sm font-medium ${toneClass}">${this.escapeValue(text)}</div>`;
    const feedbackHost = this.container?.querySelector("#settings-feedback");
    if (feedbackHost) {
      feedbackHost.innerHTML = messageHtml;
      if (this.noticeTimer) window.clearTimeout(this.noticeTimer);
      this.noticeTimer = window.setTimeout(() => {
        if (feedbackHost) feedbackHost.innerHTML = "";
      }, 4500);
      return;
    }

    const toast = document.createElement("div");
    toast.className = "fixed bottom-6 right-6 z-[10070] w-[min(92vw,380px)]";
    toast.innerHTML = messageHtml;
    document.body.appendChild(toast);
    window.setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4500);
  }

  openInlineDialog({
    type = "confirm",
    title = "Confirm action",
    message = "Are you sure?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    defaultValue = "",
    placeholder = "",
    inputType = "text",
  } = {}) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "fixed inset-0 z-[10080] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm";

      const safeTitle = this.escapeValue(title);
      const safeMessage = this.escapeValue(message).replace(/\n/g, "<br />");
      const safeConfirm = this.escapeValue(confirmText);
      const safeCancel = this.escapeValue(cancelText);
      const safePlaceholder = this.escapeValue(placeholder);
      const safeValue = this.escapeValue(defaultValue);
      const panelClass = this.darkMode
        ? "bg-[#0d1829] border-white/10 text-white"
        : "bg-white border-gray-200 text-gray-900";
      const inputClass = this.darkMode
        ? "bg-white/10 border-white/20 text-white placeholder-white/40"
        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400";
      const cancelClass = this.darkMode
        ? "text-white/70 hover:bg-white/10"
        : "text-gray-600 hover:bg-gray-100";

      overlay.innerHTML = `
        <div class="w-full max-w-md rounded-2xl border p-5 shadow-2xl ${panelClass}" role="dialog" aria-modal="true" aria-label="${safeTitle}">
          <p class="text-base font-bold">${safeTitle}</p>
          <p class="mt-1.5 text-sm leading-relaxed ${this.darkMode ? "text-white/70" : "text-gray-600"}">${safeMessage}</p>
          ${type === "prompt"
            ? `<input data-dialog-input type="${this.escapeValue(inputType)}" value="${safeValue}" placeholder="${safePlaceholder}" class="mt-3 w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inputClass}" />`
            : ""
          }
          <div class="mt-4 flex items-center justify-end gap-2">
            <button type="button" data-dialog-cancel class="px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${cancelClass}">${safeCancel}</button>
            <button type="button" data-dialog-confirm class="px-4 py-2 rounded-xl text-sm font-semibold bg-[#1e3a5f] text-white hover:bg-[#274a72] transition-colors">${safeConfirm}</button>
          </div>
        </div>
      `;

      const panel = overlay.firstElementChild;
      const input = overlay.querySelector("[data-dialog-input]");
      const confirmBtn = overlay.querySelector("[data-dialog-confirm]");
      const cancelBtn = overlay.querySelector("[data-dialog-cancel]");

      const cleanup = (result) => {
        window.removeEventListener("keydown", handleKeydown);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      };

      const handleKeydown = (event) => {
        if (event.key === "Escape") {
          cleanup(type === "confirm" ? false : null);
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          if (type === "prompt") {
            cleanup(input ? input.value : "");
          } else {
            cleanup(true);
          }
        }
      };

      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
          cleanup(type === "confirm" ? false : null);
        }
      });

      panel?.addEventListener("click", (event) => event.stopPropagation());
      cancelBtn?.addEventListener("click", () => cleanup(type === "confirm" ? false : null));
      confirmBtn?.addEventListener("click", () => {
        if (type === "prompt") {
          cleanup(input ? input.value : "");
          return;
        }
        cleanup(true);
      });

      document.body.appendChild(overlay);
      window.addEventListener("keydown", handleKeydown);
      if (input) {
        input.focus();
        input.select();
      } else {
        confirmBtn?.focus();
      }
    });
  }

  handleAction(action) {
    switch (action) {
      case "requestVerification": {
        this.handleRequestVerification();
        break;
      }
      case "changePassword": {
        this.showNotice("Password change flow can be connected to your backend API.", "info");
        break;
      }
      case "logoutDevices": {
        this.showNotice("Logout from all devices triggered (UI only).", "info");
        break;
      }
      case "deleteAccount": {
        this.handleDeleteAccount();
        break;
      }
      case "saveAccount":
      {
        this.handleSaveAccount();
        break;
      }
      case "savePrivacy": {
        this.handleSavePrivacy();
        break;
      }
      default:
        break;
    }
  }

  async handleSavePrivacy() {
    try {
      this.saveState();

      if (this.userId && this.api) {
        await this.syncToBackend();
      }

      this.showNotice("Privacy settings saved successfully.", "success");
    } catch (error) {
      this.showNotice(this.getApiErrorMessage(error, "Failed to save privacy settings."), "error");
    }
  }

  getApiErrorMessage(error, fallback) {
    return (
      error?.response?.data?.message ||
      error?.message ||
      fallback
    );
  }

  async handleRequestVerification() {
    if (this.state.emailVerified) {
      this.showNotice("Your email is already verified.", "info");
      return;
    }

    try {
      if (!this.api) {
        throw new Error("API service is unavailable");
      }

      const { data } = await this.api.post("/onboarding/send-verification");
      this.state.requestVerification = true;
      this.saveState();

      const devCodeSuffix = data?.devCode ? `\n\nDev code: ${data.devCode}` : "";
      this.showNotice(`${data?.message || "Verification code sent."}${devCodeSuffix}`, "success");
    } catch (error) {
      this.showNotice(this.getApiErrorMessage(error, "Failed to request verification."), "error");
    }
  }

  async handleSaveAccount() {
    const currentPassword = (this.state.currentPassword || "").trim();
    const newPassword = (this.state.newPassword || "").trim();
    const confirmPassword = (this.state.confirmPassword || "").trim();
    const isChangingPassword = !!(currentPassword || newPassword || confirmPassword);

    if (!isChangingPassword) {
      this.saveState();
      this.showNotice("Account settings saved.", "success");
      return;
    }

    if (!currentPassword) {
      this.showNotice("Current password is required.", "error");
      return;
    }

    if (!newPassword || !confirmPassword) {
      this.showNotice("New password and confirmation are required.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showNotice("New password and confirm password do not match.", "error");
      return;
    }

    if (newPassword.length < 6) {
      this.showNotice("New password must be at least 6 characters.", "error");
      return;
    }

    try {
      if (!this.api) {
        throw new Error("API service is unavailable");
      }

      await this.api.put("/users/change-password", {
        currentPassword,
        newPassword,
      });

      this.state.currentPassword = "";
      this.state.newPassword = "";
      this.state.confirmPassword = "";
      this.saveState();
      this.renderSubPanel();
      this.showNotice("Password changed successfully.", "success");
    } catch (error) {
      this.showNotice(this.getApiErrorMessage(error, "Failed to change password."), "error");
    }
  }

  async handleDeleteAccount() {
    const firstConfirm = await this.openInlineDialog({
      type: "confirm",
      title: "Delete account",
      message:
      "Are you sure you want to delete your account? This action cannot be undone.\n\nAll your data, posts, and reviews will be permanently deleted."
    });

    if (!firstConfirm) return;
    const userInput = await this.openInlineDialog({
      type: "prompt",
      title: "Confirm deletion",
      message: "Please type 'DELETE' to confirm account deletion:",
      placeholder: "Type DELETE",
      confirmText: "Continue",
      cancelText: "Cancel",
    });

    if (userInput === null) return;
    if (String(userInput).trim() !== "DELETE") {
      this.showNotice("Account deletion cancelled. Input did not match 'DELETE'.", "error");
      return;
    }

    const password = await this.openInlineDialog({
      type: "prompt",
      title: "Enter password",
      message: "Enter your current password to confirm account deletion:",
      placeholder: "Current password",
      inputType: "password",
      confirmText: "Delete account",
      cancelText: "Cancel",
    });

    if (!password || !String(password).trim()) {
      this.showNotice("Account deletion cancelled. Password is required.", "error");
      return;
    }

    this.performDeleteAccount(String(password));
  }

  async performDeleteAccount(password) {
    try {
      if (!this.api) {
        throw new Error("API service is unavailable");
      }

      await this.api.delete("/users/account", {
        data: {
          password,
          confirmationText: "DELETE",
        },
      });

      localStorage.removeItem(this.storageKey);
      localStorage.removeItem("user");

      this.state = this.getInitialState();

      this.showNotice(
        "Your account has been deleted successfully. You will be redirected to login.",
        "success"
      );

      window.location.href = "/login";
    } catch (error) {
      this.showNotice(
        this.getApiErrorMessage(error, "Failed to delete account. Please try again later."),
        "error"
      );
    }
  }

  goToPanel(panelId) {
    this.currentPanel = panelId;
    this.render();
    this.attachEventListeners();
  }

  updateState(updates) {
    this.state = {
      ...this.state,
      ...updates,
      profileInfoVisibility: {
        ...this.state.profileInfoVisibility,
        ...(updates.profileInfoVisibility || {}),
      },
    };
    this.saveState();
    this.render();
    this.attachEventListeners();
  }

  getState() {
    return {
      ...this.state,
      profileInfoVisibility: { ...this.state.profileInfoVisibility },
      blockedUsers: [...(this.state.blockedUsers || [])],
    };
  }

  setBlockedUsers(users) {
    this.state.blockedUsers = Array.isArray(users) ? users : [];
    this.saveState();
    if (this.currentPanel === "privacy") {
      this.renderSubPanel();
    }
  }

  escapeValue(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  injectStyles() {
    // Inject CSS for settings UI
    if (document.id("settings-ui-styles")) return;
    
    const style = document.createElement("style");
    style.id = "settings-ui-styles";
    style.textContent = `
      .settings-ui-root { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      .settings-ui-dark { color-scheme: dark; }
      .settings-ui-light { color-scheme: light; }
      .settings-category-btn { cursor: pointer; }
      .settings-password-wrap { position: relative; }
      .settings-password-toggle { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; }
      .animate-fade-in { animation: fadeIn 0.3s ease-in; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `;
    document.head.appendChild(style);
  }
}

export default PrivacySettingsUI;
