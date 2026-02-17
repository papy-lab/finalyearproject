import { Link } from "react-router-dom";
import { Calendar, Clock, Bell, BarChart3, Users, CheckCircle2 } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F2e01e69b3779464b92ed3fb015b92f56%2Fad1b5faec75e4f65a92433b7fe3f0202?format=webp&width=100"
                alt="RRA Logo"
                className="h-10"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-rra-navy">RRA Appointments</h1>
                <p className="text-xs text-gray-500">Rwanda Revenue Authority</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-700 hover:text-rra-blue transition">
                Features
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-700 hover:text-rra-blue transition">
                How It Works
              </a>
              <a href="#benefits" className="text-sm font-medium text-gray-700 hover:text-rra-blue transition">
                Benefits
              </a>
            </nav>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm font-medium text-rra-blue hover:text-rra-navy transition"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-rra-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rra-navy transition"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-green-50 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-rra-navy mb-6 leading-tight">
                Streamline Your Appointment Management
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                RRA's Appointment Management System revolutionizes how institutions schedule and manage appointments. Eliminate scheduling conflicts, automate reminders, and enhance client satisfaction with our comprehensive digital platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/signup"
                  className="bg-rra-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-rra-navy transition text-center"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/login"
                  className="border-2 border-rra-blue text-rra-blue px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition text-center"
                >
                  Sign In
                </Link>
              </div>
            </div>
            <div className="relative h-96 hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-rra-blue to-rra-green rounded-2xl opacity-10"></div>
              <Calendar className="absolute top-10 right-10 h-24 w-24 text-rra-blue opacity-50" />
              <Clock className="absolute bottom-20 left-5 h-20 w-20 text-rra-green opacity-50" />
              <Bell className="absolute bottom-10 right-20 h-16 w-16 text-rra-gold opacity-60" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-rra-navy mb-4">Core Features</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage appointments efficiently and professionally
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: "Smart Scheduling",
                description: "Calendar-based appointment booking with real-time availability and instant confirmation",
                color: "bg-blue-50 text-rra-blue"
              },
              {
                icon: Bell,
                title: "Automated Reminders",
                description: "Email notifications for confirmations, reminders, and rescheduling updates",
                color: "bg-green-50 text-rra-green"
              },
              {
                icon: Users,
                title: "Role-Based Access",
                description: "Separate interfaces for clients, staff, and administrators with customized permissions",
                color: "bg-yellow-50 text-rra-gold"
              },
              {
                icon: BarChart3,
                title: "Analytics & Reports",
                description: "Data-driven insights with visual analytics on appointment trends and performance metrics",
                color: "bg-indigo-50 text-rra-navy"
              },
              {
                icon: Clock,
                title: "Availability Management",
                description: "Staff can set working hours, time slots, and manage their calendar efficiently",
                color: "bg-emerald-50 text-rra-green"
              },
              {
                icon: CheckCircle2,
                title: "Feedback System",
                description: "Collect user satisfaction ratings and service feedback for continuous improvement",
                color: "bg-orange-50 text-rra-blue"
              }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition duration-300">
                  <div className={`${feature.color} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h4 className="text-xl font-semibold text-rra-navy mb-3">{feature.title}</h4>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-rra-navy mb-4">How It Works</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple, intuitive process for booking and managing appointments
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Create Account",
                description: "Sign up as a client or staff member in minutes"
              },
              {
                step: "2",
                title: "Find Availability",
                description: "Browse available time slots that suit your schedule"
              },
              {
                step: "3",
                title: "Book Appointment",
                description: "Select your preferred date and time with instant confirmation"
              },
              {
                step: "4",
                title: "Get Reminders",
                description: "Receive automatic notifications and updates about your appointment"
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-xl p-8 text-center">
                  <div className="w-12 h-12 bg-rra-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                    {item.step}
                  </div>
                  <h4 className="text-lg font-semibold text-rra-navy mb-2">{item.title}</h4>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <div className="text-rra-blue text-2xl">→</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-rra-navy mb-4">Key Benefits</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transforming appointment management for organizations
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {[
              {
                title: "Increased Efficiency",
                items: [
                  "Reduce administrative workload",
                  "Eliminate double-bookings",
                  "Automated scheduling process"
                ]
              },
              {
                title: "Improved Communication",
                items: [
                  "Real-time notifications",
                  "Automated reminders reduce no-shows",
                  "Instant confirmation messages"
                ]
              },
              {
                title: "Better Analytics",
                items: [
                  "Track appointment trends",
                  "Measure staff performance",
                  "Data-driven improvements"
                ]
              },
              {
                title: "Enhanced Experience",
                items: [
                  "24/7 booking availability",
                  "Simple, intuitive interface",
                  "Quick appointment management"
                ]
              }
            ].map((benefit, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-8">
                <h4 className="text-2xl font-bold text-rra-navy mb-6">{benefit.title}</h4>
                <ul className="space-y-3">
                  {benefit.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-rra-green flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module Overview Section */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-rra-navy mb-4">System Modules</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive features to manage every aspect of your appointment system
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "User Management", desc: "Registration, login, and role-based access control" },
              { title: "Appointment Scheduling", desc: "Select slots and book instantly" },
              { title: "Notification System", desc: "Email confirmations and reminders" },
              { title: "Admin Dashboard", desc: "Overview of all appointments and workload" },
              { title: "Reporting Module", desc: "Analytics and trend reports" },
              { title: "Feedback System", desc: "Collect user satisfaction ratings" }
            ].map((module, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-rra-blue hover:shadow-md transition">
                <h4 className="font-semibold text-rra-navy mb-2">{module.title}</h4>
                <p className="text-sm text-gray-600">{module.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-r from-rra-blue to-rra-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Appointment Management?
          </h3>
          <p className="text-lg text-blue-100 mb-8">
            Join RRA in revolutionizing how appointments are scheduled and managed. Get started for free today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-white text-rra-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition text-center"
            >
              Sign up
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:bg-opacity-10 transition text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-rra-navy text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">About RRA</h4>
              <p className="text-blue-200 text-sm">
                Rwanda Revenue Authority providing innovative solutions for appointment management.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
                <li><a href="#benefits" className="hover:text-white transition">Benefits</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-800 pt-8 text-center text-sm text-blue-200">
            <p>&copy; 2024 Rwanda Revenue Authority. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
