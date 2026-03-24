      {/* ════════ PROFILE CARD ════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`rounded-2xl border transition-colors relative overflow-visible ${t.card}`}
      >
        {/* Cover — clean solid for writers */}
        <div
          className={`${isWriterUser ? "h-44 sm:h-52" : "h-36 sm:h-44"} rounded-t-2xl relative overflow-hidden ${!isWriterUser ? `bg-gradient-to-r ${t.coverFrom} ${t.coverTo}` : ""}`}
          style={isWriterUser ? { background: dark ? "#0a1628" : "#1e3a5f" } : undefined}
        >
          {/* Subtle dot pattern — single, no gradients */}
          <div className="absolute inset-0" style={{
            opacity: dark ? 0.035 : 0.05,
            backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }} />

          {/* Edit / Follow button */}
          <div className="absolute top-4 right-4 z-10">
            {isOwnProfile ? (
              <button onClick={() => setShowEditModal(true)}
                className={`px-4 py-1.5 rounded-xl border text-[13px] font-semibold transition-all flex items-center gap-1.5 backdrop-blur-md ${t.editBtn}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                Edit Profile
              </button>
            ) : (
              <button onClick={handleFollow}
                className={`px-5 py-1.5 rounded-xl text-[13px] font-bold transition-all border backdrop-blur-md ${isFollowing ? t.followActive : t.followIdle}`}>
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
        </div>

        {/* Avatar + Info row */}
        <div className={isWriterUser ? "px-8 sm:px-10" : "px-6 sm:px-8"}>
          <div className={`${isWriterUser ? "-mt-16 sm:-mt-20" : "-mt-16 sm:-mt-20"} flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 relative z-20`}>
            <div className="shrink-0">
              {profile.profileImage ? (
                <img src={resolveImage(profile.profileImage)} alt={profile.name}
                  className={`${isWriterUser ? "w-32 h-32 sm:w-40 sm:h-40" : "w-28 h-28 sm:w-36 sm:h-36"} rounded-full object-cover ring-[5px] shadow-xl ${t.avatarRing}`} />
              ) : (
                <div className={`${isWriterUser ? "w-32 h-32 sm:w-40 sm:h-40" : "w-28 h-28 sm:w-36 sm:h-36"} rounded-full ring-[5px] bg-gradient-to-br flex items-center justify-center shadow-xl ${t.avatarRing} ${t.avatarGrad}`}>
                  <span className={`${isWriterUser ? "text-4xl sm:text-5xl" : "text-4xl sm:text-5xl"} font-extrabold text-white/80`}>
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                <h1 className={`${isWriterUser ? "text-2xl sm:text-3xl" : "text-2xl sm:text-3xl"} font-extrabold tracking-tight ${t.h1}`}>
                  {profile.name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${t.roleBg}`}>
                  {profile.role}
                </span>
                {isWriter(profile.role) && profile.writerProfile?.wgaMember && (
                  <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${t.wgaBadge}`}>WGA</span>
                )}
                {isWriterUser && profile.writerProfile?.representationStatus && profile.writerProfile.representationStatus !== "unrepresented" && (
                  <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold capitalize border ${dark ? "bg-emerald-900/20 border-emerald-800/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
                    {profile.writerProfile.representationStatus.replace(/_/g, " & ")}
                  </span>
                )}
              </div>
              {isOwnProfile && <p className={`text-[13px] font-medium ${t.email}`}>{profile.email}</p>}
              {profile.bio && (
                <p className={`text-[14px] leading-relaxed mt-2 line-clamp-3 ${t.body}`}>
                  {profile.bio}
                </p>
              )}
              {profile.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {profile.skills.map((skill, i) => (
                    <span key={i} className={`px-3 py-1 rounded-full text-[12px] font-semibold border ${t.chip}`}>{skill}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats — clean grid for writers */}
        <div className={isWriterUser ? "px-8 sm:px-10 pb-7 pt-6" : "px-6 sm:px-8 pb-7 pt-5"}>
          {isWriterUser ? (
            <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-5 border-t ${t.divider}`}>
              {[
                { value: scripts.length, label: "Projects", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
                { value: profile.followers.length, label: "Followers", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> },
                { value: profile.following.length, label: "Following", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg> },
                { value: profile.writerProfile?.genres?.length || 0, label: "Genres", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125" /></svg> },
                ...(memberSince ? [{ value: memberSince, label: "Joined", isStr: true, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> }] : []),
              ].map((s) => (
                <div key={s.label} className={`rounded-xl p-4 border text-center ${t.card}`}>
                  <div className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center mb-2 ${dark ? "bg-white/[0.05] text-white/40" : "bg-[#1e3a5f]/[0.06] text-[#1e3a5f]/60"}`}>
                    {s.icon}
                  </div>
                  <p className={`${s.isStr ? "text-[14px]" : "text-xl"} font-extrabold tabular-nums ${t.statNum}`}>{s.value}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${t.statLabel}`}>{s.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className={`flex flex-wrap items-end gap-6 sm:gap-8 pt-5 border-t ${t.divider}`}>
              {[
                ...(profile.role !== "investor" ? [{ value: scripts.length, label: "Projects" }] : []),
                ...(profile.role === "investor" ? [
                  { value: `₹${(profile.wallet?.balance || 0).toLocaleString()}`, label: "Balance", isStr: true },
                  { value: `₹${(profile.wallet?.totalEarnings || 0).toLocaleString()}`, label: "Total Invested", isStr: true },
                  { value: profile.subscription?.scriptScoreCredits || 0, label: "Credits" },
                ] : []),
                { value: profile.followers.length, label: "Followers" },
                { value: profile.following.length, label: "Following" },
                ...(memberSince ? [{ value: memberSince, label: "Joined", isStr: true }] : []),
              ].map((s) => (
                <div key={s.label}>
                  <p className={`${s.isStr ? "text-lg sm:text-xl" : "text-2xl"} font-extrabold tabular-nums ${t.statNum}`}>{s.value}</p>
                  <p className={`text-[11px] font-semibold uppercase tracking-wider mt-0.5 ${t.statLabel}`}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
