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

  injectStyles() {
    const styleId = "privacy-settings-ui-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .settings-ui-root .settings-select {
        -webkit-appearance: none;
        appearance: none;
        cursor: pointer;
        min-height: 44px;
        padding-right: 2.25rem;
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
        background-size: 14px;
      }

      .settings-ui-root .settings-select:focus {
        border-color: rgba(96, 165, 250, 0.7);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      }

      .settings-ui-root .settings-select::-ms-expand {
        display: none;
      }

      .settings-ui-dark .settings-select {
        background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none"%3E%3Cpath d="M5 7.5L10 12.5L15 7.5" stroke="%23E5E7EB" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/%3E%3C/svg%3E');
      }

      .settings-ui-light .settings-select {
        background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none"%3E%3Cpath d="M5 7.5L10 12.5L15 7.5" stroke="%23374151" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/%3E%3C/svg%3E');
      }

      .settings-ui-dark .settings-select option {
        background-color: #12243a;
        color: #f3f4f6;
      }

      .settings-ui-light .settings-select option {
        background-color: #ffffff;
        color: #111827;
      }

      .settings-ui-root .settings-action-btn {
        cursor: pointer;
        pointer-events: auto;
        position: relative;
        z-index: 1;
      }

      .settings-ui-root .settings-password-wrap {
        position: relative;
      }

      .settings-ui-root .settings-password-wrap .settings-input {
        padding-right: 2.75rem;
      }

      .settings-ui-root .settings-password-toggle {
        position: absolute;
        right: 0.65rem;
        top: 50%;
        transform: translateY(-50%);
        width: 1.75rem;
        height: 1.75rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 9999px;
        border: none;
        background: transparent;
        cursor: pointer;
      }

      .settings-ui-dark .settings-password-toggle {
        color: rgba(229, 231, 235, 0.75);
      }

      .settings-ui-light .settings-password-toggle {
        color: rgba(55, 65, 81, 0.8);
      }

      .settings-ui-root .settings-password-toggle:hover {
        background: rgba(148, 163, 184, 0.18);
      }
    `;

    document.head.appendChild(style);
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
        <div>
          <div>
            <label class="text-xs font-semibold uppercase tracking-wider mb-1.5 block ${theme.textMuted}">Profile Visibility</label>
            <select class="settings-select w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all ${theme.input}" data-field="profileVisibility">
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="only_me">Only Me</option>
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

    const selects = this.container.querySelectorAll(".settings-select");
    selects.forEach((select) => {
      const field = select.dataset.field;
      if (!field) return;

      if (field === "email" || field === "phone" || field === "bio") {
        select.value = this.state.profileInfoVisibility[field] || "hidden";
      } else {
        select.value = this.state[field] || "";
      }

      select.addEventListener("change", (event) => {
        const value = event.target.value;
        if (field === "email" || field === "phone" || field === "bio") {
          this.state.profileInfoVisibility[field] = value;
        } else {
          this.state[field] = value;
        }
        this.saveState();
      });
    });

    const inputs = this.container.querySelectorAll(".settings-input");
    inputs.forEach((input) => {
      const field = input.dataset.field;
      if (!field) return;

      input.addEventListener("input", (event) => {
        this.state[field] = event.target.value;
        this.saveState();
      });
    });

    const toggles = this.container.querySelectorAll(".settings-toggle");
    toggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const field = toggle.dataset.field;
        if (!field) return;
        this.state[field] = !this.state[field];
        this.saveState();
        this.renderSubPanel();
      });
    });

    const unblockBtns = this.container.querySelectorAll(".settings-unblock-btn");
    unblockBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const userId = btn.dataset.userId;
        this.state.blockedUsers = this.state.blockedUsers.filter(
          (user, idx) =>
            String(user?._id || user?.id || idx) !== String(userId)
        );
        this.saveState();
        this.renderSubPanel();
      });
    });

    const passwordToggles = this.container.querySelectorAll(".settings-password-toggle");
    passwordToggles.forEach((toggleBtn) => {
      toggleBtn.addEventListener("click", () => {
        const targetField = toggleBtn.dataset.targetField;
        if (!targetField) return;

        const input = this.container.querySelector(`.settings-input[data-field="${targetField}"]`);
        if (!input) return;

        const isVisible = input.type === "text";
        input.type = isVisible ? "password" : "text";
        toggleBtn.innerHTML = this.getPasswordToggleIcon(!isVisible);
        toggleBtn.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
      });
    });

  }

  getPasswordToggleIcon(isVisible) {
    if (isVisible) {
      return `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
          <path d="M3 3L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M10.58 10.58C10.21 10.95 10 11.46 10 12C10 13.1 10.9 14 12 14C12.54 14 13.05 13.79 13.42 13.42" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9.88 5.09C10.56 4.94 11.27 4.86 12 4.86C16.5 4.86 20.31 7.82 21.57 12C21.14 13.44 20.33 14.74 19.24 15.77M6.23 6.23C4.97 7.33 3.98 8.79 3.43 10.45C4.69 14.63 8.5 17.59 13 17.59C14.07 17.59 15.1 17.42 16.07 17.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
        <path d="M2.5 12C3.88 7.95 7.63 5.11 12 5.11C16.37 5.11 20.12 7.95 21.5 12C20.12 16.05 16.37 18.89 12 18.89C7.63 18.89 3.88 16.05 2.5 12Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
      </svg>
    `;
  }

  handleAction(action) {
    switch (action) {
      case "requestVerification": {
        this.handleRequestVerification();
        break;
      }
      case "changePassword": {
        window.alert("Password change flow can be connected to your backend API.");
        break;
      }
      case "logoutDevices": {
        window.alert("Logout from all devices triggered (UI only).");
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

      window.alert("Privacy settings saved successfully.");
    } catch (error) {
      window.alert(this.getApiErrorMessage(error, "Failed to save privacy settings."));
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
      window.alert("Your email is already verified.");
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
      window.alert(`${data?.message || "Verification code sent."}${devCodeSuffix}`);
    } catch (error) {
      window.alert(this.getApiErrorMessage(error, "Failed to request verification."));
    }
  }

  async handleSaveAccount() {
    const currentPassword = (this.state.currentPassword || "").trim();
    const newPassword = (this.state.newPassword || "").trim();
    const confirmPassword = (this.state.confirmPassword || "").trim();
    const isChangingPassword = !!(currentPassword || newPassword || confirmPassword);

    if (!isChangingPassword) {
      this.saveState();
      window.alert("Account settings saved.");
      return;
    }

    if (!currentPassword) {
      window.alert("Current password is required.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      window.alert("New password and confirmation are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      window.alert("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 6) {
      window.alert("New password must be at least 6 characters.");
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
      window.alert("Password changed successfully.");
    } catch (error) {
      window.alert(this.getApiErrorMessage(error, "Failed to change password."));
    }
  }

  handleDeleteAccount() {
    const firstConfirm = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone.\n\nAll your data, posts, and reviews will be permanently deleted."
    );

    if (!firstConfirm) return;
    const userInput = window.prompt(
      "Please type 'DELETE' to confirm account deletion:"
    );

    if (userInput !== "DELETE") {
      window.alert("Account deletion cancelled. Input did not match 'DELETE'.");
      return;
    }

    const password = window.prompt(
      "Enter your current password to confirm account deletion:"
    );

    if (!password) {
      window.alert("Account deletion cancelled. Password is required.");
      return;
    }

    this.performDeleteAccount(password);
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

      window.alert(
        "Your account has been deleted successfully. You will be redirected to login."
      );

      window.location.href = "/login";
    } catch (error) {
      window.alert(
        this.getApiErrorMessage(error, "Failed to delete account. Please try again later.")
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
      .replace(/\"/g, "&quot;");
  }
}

export default PrivacySettingsUI;
