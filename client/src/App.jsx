import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useContext } from "react";
import { AuthProvider } from "./context/AuthContext";
import { DarkModeProvider } from "./context/DarkModeContext";
import PrivateRoute from "./utils/PrivateRoute";
import { AuthContext } from "./context/AuthContext";

const Landing = lazy(() => import("./pages/Landing"));
const PrivacyPolicy = lazy(() => import("./pages/PolicyPage"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const RegistrationPrivacyPolicy = lazy(() => import("./pages/RegistrationPrivacyPolicy"));
const WriterTermsConditions = lazy(() => import("./pages/WriterTermsConditions"));
const InvestorTermsConditions = lazy(() => import("./pages/InvestorTermsConditions"));
const ScriptUploadTermsConditions = lazy(() => import("./pages/ScriptUploadTermsConditions"));
const Login = lazy(() => import("./pages/Login"));
const Join = lazy(() => import("./pages/Join"));
const RoleSelection = lazy(() => import("./pages/RoleSelection"));
const WriterOnboarding = lazy(() => import("./pages/WriterOnboarding"));
const InvestorOnboarding = lazy(() => import("./pages/InvestorOnboarding"));
const IndustryOnboarding = lazy(() => import("./pages/IndustryOnboarding"));
const Profile = lazy(() => import("./pages/Profile"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ScriptUpload = lazy(() => import("./pages/ScriptUpload"));
const NewProject = lazy(() => import("./pages/NewProject"));
const CreateProject = lazy(() => import("./pages/CreateProject"));
const Search = lazy(() => import("./pages/Search"));
const ScriptDetail = lazy(() => import("./pages/ScriptDetail"));
const FeaturedProjects = lazy(() => import("./pages/FeaturedProjects"));
const Mandates = lazy(() => import("./pages/Mandates"));
const TopList = lazy(() => import("./pages/TopList"));
const Messages = lazy(() => import("./pages/Messages"));
const Writers = lazy(() => import("./pages/Writers"));
const InvestorHome = lazy(() => import("./pages/InvestorHome"));
const ReaderHome = lazy(() => import("./pages/ReaderHome"));
const ScriptReader = lazy(() => import("./pages/ScriptReader"));
const ReaderProfile = lazy(() => import("./pages/ReaderProfile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const WriterPurchaseRequests = lazy(() => import("./pages/WriterPurchaseRequests"));
const MainLayout = lazy(() => import("./layouts/MainLayout"));

const preloadRouteChunks = [
  () => import("./layouts/MainLayout"),
  () => import("./pages/Login"),
  () => import("./pages/Join"),
  () => import("./pages/Dashboard"),
  () => import("./pages/Profile"),
];

// Handles admin impersonation login via URL parameter
function AdminLoginHandler({ children }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  useEffect(() => {
    const adminLoginData = searchParams.get("adminLogin");
    if (adminLoginData) {
      try {
        const userData = JSON.parse(decodeURIComponent(adminLoginData));
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        // Clean URL by navigating without the query param
        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("Failed to parse admin login data:", err);
      }
    }
  }, [searchParams, setUser, navigate]);

  return children;
}

function App() {
  useEffect(() => {
    const preload = () => {
      preloadRouteChunks.forEach((loadChunk) => {
        loadChunk().catch(() => {
          // Ignore prefetch errors; lazy route loading still works as fallback.
        });
      });
    };

    const idleCallback = window.requestIdleCallback
      ? window.requestIdleCallback(preload, { timeout: 1200 })
      : setTimeout(preload, 300);

    return () => {
      if (window.cancelIdleCallback && typeof idleCallback === "number") {
        window.cancelIdleCallback(idleCallback);
      } else {
        clearTimeout(idleCallback);
      }
    };
  }, []);

  return (
    <DarkModeProvider>
      <AuthProvider>
        <Router>
          <AdminLoginHandler>
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center text-sm text-gray-500 bg-white">
                  Loading...
                </div>
              }
            >
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/registration-privacy-policy" element={<RegistrationPrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/writer-terms" element={<WriterTermsConditions />} />
              <Route path="/investor-terms" element={<InvestorTermsConditions />} />
              <Route path="/script-upload-terms" element={<ScriptUploadTermsConditions />} />
              <Route path="/login" element={<Login />} />
              <Route path="/join" element={<RoleSelection />} />
              <Route path="/signup" element={<Join />} />
              <Route path="/writer-onboarding" element={<WriterOnboarding />} />
              <Route path="/producer-director-onboarding" element={<InvestorOnboarding />} />
              <Route path="/investor-onboarding" element={<Navigate to="/producer-director-onboarding" replace />} />
              <Route path="/industry-onboarding" element={
                <PrivateRoute>
                  <MainLayout>
                    <IndustryOnboarding />
                  </MainLayout>
                </PrivateRoute>
              } />
              <Route
                path="/top-list"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <TopList />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/featured"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <FeaturedProjects />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/trending"
                element={<Navigate to="/top-list" replace />}
              />
              <Route
                path="/profile/:id?"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Profile />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/credits"
                element={<Navigate to="/dashboard" replace />}
              />
              <Route
                path="/purchase-requests"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <WriterPurchaseRequests />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/new-project"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <NewProject />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/ai-tools"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/offer-holds"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/create-project"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <CreateProject />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/create-project/:draftId"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <CreateProject />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <ScriptUpload />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Search />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/script/:id"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <ScriptDetail />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/mandates"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Mandates />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/writers"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Writers />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/home"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <InvestorHome />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Messages />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/reader"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <ReaderHome />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/reader/script/:id"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <ScriptReader />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/reader/profile/:id?"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <ReaderProfile />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/reader/search"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <ReaderHome />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/reader/featured"
                element={<Navigate to="/top-list" replace />}
              />
              <Route
                path="/admin"
                element={<AdminDashboard />}
              />
            </Routes>
            </Suspense>
          </AdminLoginHandler>
        </Router>
      </AuthProvider>
    </DarkModeProvider>
  );
}

export default App;