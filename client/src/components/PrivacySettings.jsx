import { useState } from "react";
import { ChevronRight, ChevronLeft, Lock, MessageSquare, Eye, FileText, Database, Shield, Ban } from "lucide-react";

const PrivacySettings = ({ dark, privacySettings, setPrivacySettings }) => {
  const [activeSection, setActiveSection] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Settings categories with icons and descriptions
  const categories = [
    {
      id: "account",
      label: "Account Privacy",
      description: "Control who can see your profile",
      icon: Lock,
    },
    {
      id: "messaging",
      label: "Messaging",
      description: "Who can message you",
      icon: MessageSquare,
    },
    {
      id: "activity",
      label: "Activity Status",
      description: "Show when you're online",
      icon: Eye,
    },
    {
      id: "profile",
      label: "Profile Info",
      description: "Control info visibility",
      icon: FileText,
    },
    {
      id: "data",
      label: "Data & Personalization",
      description: "Analytics and ads",
      icon: Database,
    },
    {
      id: "security",
      label: "Security",
      description: "Password and 2FA settings",
      icon: Shield,
    },
    {
      id: "blocked",
      label: "Blocked Users",
      description: `${privacySettings.blockedUsers.length} blocked`,
      icon: Ban,
    },
  ];

  const togglePrivacySetting = (key) => {
    setPrivacySettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateProfileInfoVisibility = (field, value) => {
    setPrivacySettings((prev) => ({
      ...prev,
      profileInfoVisibility: {
        ...prev.profileInfoVisibility,
        [field]: value,
      },
    }));
  };

  const handleSectionClick = (sectionId) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSection(sectionId);
      setIsTransitioning(false);
    }, 150);
  };

  const handleBack = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSection(null);
      setIsTransitioning(false);
    }, 150);
  };

  // Custom Toggle Component
  const ToggleSwitch = ({ value, onChange }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-all duration-300 flex items-center ${
        value
          ? dark
            ? "bg-emerald-500/40"
            : "bg-emerald-100"
          : dark
          ? "bg-white/[0.08]"
          : "bg-gray-200"
      }`}
      type="button"
    >
      <div
        className={`w-5 h-5 rounded-full transition-all duration-300 ${
          value
            ? `${dark ? "bg-emerald-400" : "bg-emerald-500"} translate-x-6`
            : `${dark ? "bg-white/40" : "bg-white"} translate-x-1`
        }`}
      />
    </button>
  );

  // Custom Select Component with better styling
  const SelectInput = ({ value, onChange, options, label }) => (
    <div>
      {label && (
        <label
          className={`text-xs font-semibold uppercase tracking-wider mb-2 block ${
            dark ? "text-white/50" : "text-gray-500"
          }`}
        >
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 rounded-xl text-sm font-medium border outline-none cursor-pointer transition-all ${
          dark
            ? "bg-white/[0.04] border-white/[0.12] text-white/85 hover:bg-white/[0.06]"
            : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50"
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  // Section Components
  const AccountPrivacySection = () => (
    <div className="space-y-4">
      <SelectInput
        value={privacySettings.profileVisibility}
        onChange={(val) =>
          setPrivacySettings((prev) => ({
            ...prev,
            profileVisibility: val,
          }))
        }
        label="Profile Visibility"
        options={[
          { value: "public", label: "🌐 Public - Everyone can see" },
          { value: "private", label: "🔒 Private - Followers only" },
          { value: "only_me", label: "👤 Only Me" },
        ]}
      />
      <p className={`text-xs leading-relaxed ${dark ? "text-white/30" : "text-gray-500"}`}>
        Choose who can view your complete profile, scripts, and activity.
      </p>
    </div>
  );

  const MessagingSection = () => (
    <div className="space-y-4">
      <SelectInput
        value={privacySettings.messagingPermissions}
        onChange={(val) =>
          setPrivacySettings((prev) => ({
            ...prev,
            messagingPermissions: val,
          }))
        }
        label="Who can message you"
        options={[
          { value: "everyone", label: "👥 Everyone" },
          {
            value: "followers_only",
            label: "⭐ Followers Only",
          },
          { value: "no_one", label: "🚫 No One" },
        ]}
      />
      <p className={`text-xs leading-relaxed ${dark ? "text-white/30" : "text-gray-500"}`}>
        Restrict who can send you direct messages and requests.
      </p>
    </div>
  );

  const ActivityStatusSection = () => (
    <div className="space-y-5">
      <div
        className={`rounded-xl border p-4 ${
          dark ? "border-white/[0.08] bg-white/[0.03]" : "border-gray-100 bg-gray-50"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h4 className={`text-sm font-semibold ${dark ? "text-white/80" : "text-gray-900"}`}>
              Show Online Status
            </h4>
            <p className={`text-xs mt-1 ${dark ? "text-white/40" : "text-gray-500"}`}>
              Let others see when you're active
            </p>
          </div>
          <ToggleSwitch
            value={privacySettings.showOnlineStatus}
            onChange={() => togglePrivacySetting("showOnlineStatus")}
          />
        </div>
      </div>
      <p className={`text-xs leading-relaxed ${dark ? "text-white/30" : "text-gray-500"}`}>
        When enabled, your last seen time and online status will be visible to other users.
      </p>
    </div>
  );

  const ProfileInfoSection = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <SelectInput
          value={privacySettings.profileInfoVisibility.email}
          onChange={(val) => updateProfileInfoVisibility("email", val)}
          label="Email Visibility"
          options={[
            { value: "public", label: "🌐 Public" },
            { value: "hidden", label: "🔒 Hidden" },
          ]}
        />
        <SelectInput
          value={privacySettings.profileInfoVisibility.phone}
          onChange={(val) => updateProfileInfoVisibility("phone", val)}
          label="Phone Visibility"
          options={[
            { value: "public", label: "🌐 Public" },
            { value: "hidden", label: "🔒 Hidden" },
          ]}
        />
        <SelectInput
          value={privacySettings.profileInfoVisibility.bio}
          onChange={(val) => updateProfileInfoVisibility("bio", val)}
          label="Bio Visibility"
          options={[
            { value: "public", label: "🌐 Public" },
            { value: "private", label: "🔒 Private" },
          ]}
        />
      </div>
      <p className={`text-xs leading-relaxed ${dark ? "text-white/30" : "text-gray-500"}`}>
        Control the visibility of your personal information on your profile.
      </p>
    </div>
  );

  const DataPersonalizationSection = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        {[
          {
            key: "allowAnalytics",
            label: "Allow Analytics",
            desc: "Help us improve by sharing anonymized usage data",
          },
          {
            key: "personalizedAds",
            label: "Personalized Ads",
            desc: "Show ads relevant to your interests",
          },
        ].map((item) => (
          <div
            key={item.key}
            className={`rounded-xl border p-4 ${
              dark ? "border-white/[0.08] bg-white/[0.03]" : "border-gray-100 bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h4 className={`text-sm font-semibold ${dark ? "text-white/80" : "text-gray-900"}`}>
                  {item.label}
                </h4>
                <p className={`text-xs mt-1 ${dark ? "text-white/40" : "text-gray-500"}`}>
                  {item.desc}
                </p>
              </div>
              <ToggleSwitch
                value={privacySettings[item.key]}
                onChange={() => togglePrivacySetting(item.key)}
              />
            </div>
          </div>
        ))}
      </div>
      <p className={`text-xs leading-relaxed ${dark ? "text-white/30" : "text-gray-500"}`}>
        Your data is processed according to our privacy policy. You can change these settings anytime.
      </p>
    </div>
  );

  const SecuritySection = () => (
    <div className="space-y-4">
      <button
        className={`w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all border ${
          dark
            ? "border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/15"
            : "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
        }`}
      >
        🔑 Change Password
      </button>

      <div
        className={`rounded-xl border p-4 ${
          dark ? "border-white/[0.08] bg-white/[0.03]" : "border-gray-100 bg-gray-50"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h4 className={`text-sm font-semibold ${dark ? "text-white/80" : "text-gray-900"}`}>
              Two-Factor Authentication
            </h4>
            <p className={`text-xs mt-1 ${dark ? "text-white/40" : "text-gray-500"}`}>
              Add extra security to your account
            </p>
          </div>
          <ToggleSwitch
            value={privacySettings.enableTwoFactor}
            onChange={() => togglePrivacySetting("enableTwoFactor")}
          />
        </div>
      </div>

      <p className={`text-xs leading-relaxed ${dark ? "text-white/30" : "text-gray-500"}`}>
        Protect your account with additional verification methods.
      </p>
    </div>
  );

  const BlockedUsersSection = () => (
    <div className="space-y-4">
      {privacySettings.blockedUsers && privacySettings.blockedUsers.length > 0 ? (
        <div className="space-y-2">
          {privacySettings.blockedUsers.map((user, idx) => (
            <div
              key={user?._id || user?.id || idx}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                dark
                  ? "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
                  : "border-gray-100 bg-gray-50 hover:bg-gray-100"
              } transition-colors`}
            >
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    dark ? "text-white/70" : "text-gray-800"
                  }`}
                >
                  {user?.name || user?.username || "Blocked user"}
                </p>
              </div>
              <button
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  dark
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "bg-red-100 text-red-600 hover:bg-red-200"
                }`}
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`rounded-xl border p-6 text-center ${
            dark ? "border-white/[0.08] bg-white/[0.03]" : "border-gray-100 bg-gray-50"
          }`}
        >
          <Ban className={`w-8 h-8 mx-auto mb-2 ${dark ? "text-white/20" : "text-gray-300"}`} />
          <p className={`text-sm ${dark ? "text-white/40" : "text-gray-500"}`}>
            No blocked users yet
          </p>
        </div>
      )}
      <p className={`text-xs leading-relaxed ${dark ? "text-white/30" : "text-gray-500"}`}>
        Blocked users cannot view your profile or message you.
      </p>
    </div>
  );

  // Section title and close button
  const SectionHeader = ({ title, icon: Icon }) => (
    <div className="flex items-center gap-3 mb-2">
      <button
        onClick={handleBack}
        className={`p-2 rounded-lg transition-all hover:scale-110 ${
          dark ? "hover:bg-white/[0.08]" : "hover:bg-gray-100"
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <Icon className="w-5 h-5" />
      <h2 className={`text-lg font-bold ${dark ? "text-white/90" : "text-gray-900"}`}>
        {title}
      </h2>
    </div>
  );

  // Get current section data
  const currentCategory = categories.find((cat) => cat.id === activeSection);
  const CurrentIcon = currentCategory?.icon;

  const renderSection = () => {
    switch (activeSection) {
      case "account":
        return <AccountPrivacySection />;
      case "messaging":
        return <MessagingSection />;
      case "activity":
        return <ActivityStatusSection />;
      case "profile":
        return <ProfileInfoSection />;
      case "data":
        return <DataPersonalizationSection />;
      case "security":
        return <SecuritySection />;
      case "blocked":
        return <BlockedUsersSection />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all ${
        dark
          ? "bg-gradient-to-br from-white/[0.03] to-white/[0.01] border-white/[0.06]"
          : "bg-white border-gray-100 shadow-sm"
      }`}
    >
      {/* Main view */}
      <div
        className={`transition-all duration-300 ${
          activeSection ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5" />
            <h2 className={`text-xl font-bold ${dark ? "text-white/90" : "text-gray-900"}`}>
              Privacy Settings
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleSectionClick(category.id)}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 group ${
                    dark
                      ? "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.12]"
                      : "border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Icon
                      className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                        dark ? "text-white/60" : "text-gray-600"
                      }`}
                    />
                    <ChevronRight
                      className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${
                        dark ? "text-white/30" : "text-gray-300"
                      }`}
                    />
                  </div>
                  <h3 className={`font-semibold ${dark ? "text-white/85" : "text-gray-900"}`}>
                    {category.label}
                  </h3>
                  <p
                    className={`text-xs mt-1 ${dark ? "text-white/40" : "text-gray-500"}`}
                  >
                    {category.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section view */}
      <div
        className={`transition-all duration-300 ${
          activeSection ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none absolute"
        }`}
      >
        <div className="p-6 md:p-8">
          {CurrentIcon && <SectionHeader title={currentCategory?.label} icon={CurrentIcon} />}
          <div className="mt-5">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
