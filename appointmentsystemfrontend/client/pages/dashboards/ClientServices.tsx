import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, FileText, AlertCircle } from "lucide-react";
import ClientLayout from "@/components/layout/ClientLayout";
import { api, ServiceCatalogResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ServiceWithBooking extends ServiceCatalogResponse {
  duration?: string;
  waitTime?: string;
}

export default function ClientServices() {
  const [services, setServices] = useState<ServiceWithBooking[]>([]);
  const [departments, setDepartments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const [servicesData, departmentsData] = await Promise.all([
          api.listServices(),
          api.listDepartments(),
        ]);

        // Create department map
        const deptMap: Record<string, string> = {};
        departmentsData.forEach((dept) => {
          deptMap[dept.id] = dept.name;
        });
        setDepartments(deptMap);

        // Add mock durations and wait times
        const enrichedServices = servicesData.map((service) => ({
          ...service,
          duration:
            service.name === "Income Tax Consultation"
              ? "30 minutes"
              : service.name === "VAT Registration"
                ? "30 minutes"
                : service.name === "Tax Clearance Certificate"
                  ? "30 minutes"
                  : service.name === "TIN Registration"
                    ? "30 minutes"
                    : service.name === "Export Documentation"
                      ? "30 minutes"
                      : service.name === "Business Tax Registration"
                        ? "30 minutes"
                        : "30 minutes",
          waitTime:
            service.name === "Income Tax Consultation"
              ? "2-3 days"
              : service.name === "VAT Registration"
                ? "2-3 days"
                : service.name === "Tax Clearance Certificate"
                  ? "2-3 days"
                  : service.name === "TIN Registration"
                    ? "2-3 days"
                    : service.name === "Export Documentation"
                      ? "2-3 days"
                      : service.name === "Business Tax Registration"
                        ? "2-3 days"
                        : "2-3 days",
        }));

        setServices(enrichedServices);
        setError(null);
      } catch (err) {
        console.error("Failed to load services:", err);
        setError("Failed to load services. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load services",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [toast]);

  const handleBookAppointment = (serviceId: string, serviceName: string) => {
    navigate("/appointments", {
      state: { selectedService: serviceId, serviceName },
    });
  };

  const filteredServices =
    selectedDepartment === "all"
      ? services
      : services.filter((s) => s.departmentId === selectedDepartment);

  const availabilityColor =
    (service: ServiceWithBooking): string => {
      if (service.active) {
        return "text-green-600";
      }
      return "text-red-600";
    };

  const availabilityLabel = (service: ServiceWithBooking): string => {
    if (service.active) {
      return "High Availability";
    }
    return "Unavailable";
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rra-blue"></div>
                <p className="mt-4 text-gray-600">Loading services...</p>
              </div>
            </div>
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-rra-navy mb-2">
              Services Catalog
            </h1>
            <p className="text-gray-600">
              Browse all available RRA services and book appointments
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-xs uppercase text-gray-500">Total Services</p>
              <p className="text-3xl font-bold text-rra-navy">{services.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-xs uppercase text-gray-500">Departments</p>
              <p className="text-3xl font-bold text-rra-navy">
                {Object.keys(departments).length}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-xs uppercase text-gray-500">Avg Duration</p>
              <p className="text-3xl font-bold text-rra-navy">35m</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Filter by Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
              >
                <option value="all">All Departments</option>
                {Object.entries(departments).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition"
              >
                {/* Service Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-rra-navy mb-1">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {departments[service.departmentId] || "Department"}
                  </p>
                </div>

                {/* Availability Badge */}
                <div className="mb-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      service.active
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {availabilityLabel(service)}
                  </span>
                </div>

                {/* Description */}
                {service.description && (
                  <p className="text-gray-600 text-sm mb-4">
                    {service.description}
                  </p>
                )}

                {/* Details */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{service.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Wait: {service.waitTime}</span>
                  </div>
                </div>

                {/* Requirements */}
                {service.requirements && (
                  <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-blue-900 mb-2">
                          Required Documents:
                        </p>
                        <ul className="text-xs text-blue-800 space-y-1">
                          {service.requirements.split(",").map((req, idx) => (
                            <li key={idx}>• {req.trim()}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Book Button */}
                <button
                  onClick={() => handleBookAppointment(service.id, service.name)}
                  disabled={!service.active}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition ${
                    service.active
                      ? "bg-rra-blue text-white hover:bg-rra-navy"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {service.active ? "Book Appointment" : "Service Unavailable"}
                </button>
              </div>
            ))}
          </div>

          {/* No Services Message */}
          {filteredServices.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No services available in the selected department.
              </p>
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
