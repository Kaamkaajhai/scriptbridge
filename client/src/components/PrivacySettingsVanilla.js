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

    this.state = {
      accountEmail: "",
      emailVerified: false,
      requestVerification: false,
      profileVisibility: "public",
      messagingPermissions: "everyone",
      showOnlineStatus: true,
      profileInfoVisibility: {
        email: "hidden",
        phone: "hidden",
        bio: "public",
      },
      allowAnalytics: true,
      personalizedAds: false,
      enableTwoFactor: false,
      blockedUsers: [],
    };

    this.loadState();
    this.init();
  }

  init() {
    if (!this.container) return;
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
        desc: "Visibility, messaging, online status and data",
      },
      {
        id: "security",
        title: "Security Settings",
        desc: "Password actions, two-factor auth and session controls",
      },
    ];

    this.container.innerHTML = `
      <div class="rounded-2xl border overflow-hidden transition-all ${theme.shell}">
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
      <div class="rounded-2xl border overflow-hidden transition-all ${theme.shell}">
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
            <label class="text-xs font-semibold uppercase tracking-wider mb-1.5 block ${theme.textMuted}">New Password</label>
            <input class="settings-input w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all ${theme.input}" data-field="newPassword" type="password" placeholder="Enter new password" />
          </div>
          <div>
            <label class="text-xs font-semibold uppercase tracking-wider mb-1.5 block ${theme.textMuted}">Confirm Password</label>
            <input class="settings-input w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all ${theme.input}" data-field="confirmPassword" type="password" placeholder="Confirm password" />
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
        ${this.renderToggleRow("personalizedAds", "Personalized Ads", "Allow personalized recommendations and ads")}

        <div class="rounded-xl border p-3 ${this.darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}">
          <div class="flex items-center justify-between gap-2 mb-2">
            <p class="text-sm font-semibold ${theme.text}">Blocked Users</p>
            <span class="text-xs ${theme.textSecondary}">${this.state.blockedUsers.length}</span>
          </div>
          <div class="space-y-1.5">
            ${
              this.state.blockedUsers.length
                ? this.state.blockedUsers
                    .slice(0, 4)
                    .map(
                      (user, idx) => `
                  <div class="flex items-center justify-between px-2.5 py-2 rounded-lg ${this.darkMode ? "bg-white/5" : "bg-white"}">
                    <p class="text-xs ${theme.textSecondary}">${this.escapeValue(user?.name || user?.username || `User ${idx + 1}`)}</p>
                    <button type="button" class="settings-unblock-btn text-[11px] font-semibold ${this.darkMode ? "text-red-400" : "text-red-600"}" data-user-id="${this.escapeValue(user?._id || user?.id || String(idx))}">Unblock</button>
                  </div>
                `
                    )
                    .join("")
                : `<p class="text-xs ${theme.textMuted}">No blocked users.</p>`
            }
          </div>
        </div>

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

    const actionBtns = this.container.querySelectorAll(".settings-action-btn");
    actionBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.handleAction(btn.dataset.action));
    });
  }

  handleAction(action) {
    switch (action) {
      case "requestVerification": {
        this.state.requestVerification = true;
        this.saveState();
        window.alert("Verification request captured in UI state.");
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
      case "saveAccount":
      case "savePrivacy": {
        this.saveState();
        break;
      }
      default:
        break;
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
