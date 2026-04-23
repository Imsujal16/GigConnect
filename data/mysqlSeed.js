module.exports = {
  services: [
    {
      name: "Plumbing",
      slug: "plumbing",
      icon: "/assets/plumbing.png",
      description: "Leak repair, fittings, drain cleaning, and bathroom fixes.",
      basePriceInr: 499
    },
    {
      name: "Electricians",
      slug: "electricians",
      icon: "/assets/electrician.png",
      description: "Wiring, repairs, installations, and power backup support.",
      basePriceInr: 599
    },
    {
      name: "Drivers",
      slug: "drivers",
      icon: "/assets/driver.png",
      description: "Local travel, office commute, airport pickup, and day duty.",
      basePriceInr: 799
    },
    {
      name: "Home cleaning",
      slug: "home-cleaning",
      icon: "/assets/home cleaning.png",
      description: "Deep cleaning, kitchen cleaning, and recurring upkeep.",
      basePriceInr: 699
    },
    {
      name: "Delivery",
      slug: "delivery",
      icon: "/assets/delivery.png",
      description: "Local errands, document pickup, and same-day delivery.",
      basePriceInr: 349
    },
    {
      name: "IT support",
      slug: "it-support",
      icon: "/assets/Screenshot 2025-09-23 151227.png",
      description: "Laptop repair, Wi-Fi setup, printer help, and CCTV checks.",
      basePriceInr: 899
    },
    {
      name: "Laundry",
      slug: "laundry",
      icon: "/assets/laundry.png",
      description: "Wash, iron, pickup, and express laundry turnaround.",
      basePriceInr: 299
    },
    {
      name: "Fitness",
      slug: "fitness",
      icon: "/assets/fitness.png",
      description: "Personal training, home sessions, and weekly coaching.",
      basePriceInr: 999
    }
  ],
  professionals: [
    {
      fullName: "Ravi Kumar",
      email: "ravi.kumar@gigconnect.in",
      phone: "9876543210",
      password: "Pro@123",
      city: "Gurugram",
      area: "Sector 56",
      yearsExperience: 8,
      hourlyRateInr: 650,
      distanceKm: 2,
      photoUrl: "/assets/Ravi kumar.png",
      bio: "Verified electrician for wiring, inverter issues, and quick residential repairs.",
      isVerified: true,
      serviceSlugs: ["electricians", "it-support"],
      customRates: {
        electricians: 599,
        "it-support": 899
      }
    },
    {
      fullName: "Priya Sharma",
      email: "priya.sharma@gigconnect.in",
      phone: "9811087654",
      password: "Pro@123",
      city: "Gurugram",
      area: "DLF Phase 4",
      yearsExperience: 9,
      hourlyRateInr: 700,
      distanceKm: 3,
      photoUrl: "/assets/Priya S.png",
      bio: "Trusted plumber for bathrooms, kitchens, leak repair, and maintenance visits.",
      isVerified: true,
      serviceSlugs: ["plumbing"],
      customRates: {
        plumbing: 549
      }
    },
    {
      fullName: "Arjun Mehta",
      email: "arjun.mehta@gigconnect.in",
      phone: "9899123456",
      password: "Pro@123",
      city: "Gurugram",
      area: "Sector 47",
      yearsExperience: 6,
      hourlyRateInr: 850,
      distanceKm: 4,
      photoUrl: "/assets/atif 2ndpage.png",
      bio: "Professional driver available for office drops, airport duty, and full-day bookings.",
      isVerified: true,
      serviceSlugs: ["drivers", "delivery"],
      customRates: {
        drivers: 899,
        delivery: 349
      }
    },
    {
      fullName: "Neha Yadav",
      email: "neha.yadav@gigconnect.in",
      phone: "9822012345",
      password: "Pro@123",
      city: "Gurugram",
      area: "Sushant Lok",
      yearsExperience: 7,
      hourlyRateInr: 750,
      distanceKm: 1,
      photoUrl: "/assets/atif 2ndpage.png",
      bio: "Home cleaning specialist focused on apartments, kitchens, and move-in refresh jobs.",
      isVerified: true,
      serviceSlugs: ["home-cleaning", "laundry"],
      customRates: {
        "home-cleaning": 699,
        laundry: 299
      }
    },
    {
      fullName: "Sandeep Verma",
      email: "sandeep.verma@gigconnect.in",
      phone: "9845012345",
      password: "Pro@123",
      city: "Delhi",
      area: "Dwarka",
      yearsExperience: 10,
      hourlyRateInr: 720,
      distanceKm: 7,
      photoUrl: "/assets/suresh 2ndpage.png",
      bio: "Senior technician for electrical repair, CCTV, and small office IT setups.",
      isVerified: true,
      serviceSlugs: ["electricians", "it-support"],
      customRates: {
        electricians: 649,
        "it-support": 949
      }
    },
    {
      fullName: "Kavita Joshi",
      email: "kavita.joshi@gigconnect.in",
      phone: "9898981234",
      password: "Pro@123",
      city: "Noida",
      area: "Sector 62",
      yearsExperience: 5,
      hourlyRateInr: 540,
      distanceKm: 8,
      photoUrl: "/assets/rajesh 2ndpage.png",
      bio: "Reliable laundry and home upkeep partner for busy households and working couples.",
      isVerified: false,
      serviceSlugs: ["laundry", "home-cleaning"],
      customRates: {
        laundry: 279,
        "home-cleaning": 649
      }
    },
    {
      fullName: "Imran Khan",
      email: "imran.khan@gigconnect.in",
      phone: "9810098100",
      password: "Pro@123",
      city: "Faridabad",
      area: "Sector 15",
      yearsExperience: 11,
      hourlyRateInr: 980,
      distanceKm: 10,
      photoUrl: "/assets/suresh 2ndpage.png",
      bio: "Fitness coach for home workouts, strength plans, and beginner transformation programs.",
      isVerified: true,
      serviceSlugs: ["fitness"],
      customRates: {
        fitness: 999
      }
    },
    {
      fullName: "Pooja Bansal",
      email: "pooja.bansal@gigconnect.in",
      phone: "9958701234",
      password: "Pro@123",
      city: "Gurugram",
      area: "Sector 43",
      yearsExperience: 4,
      hourlyRateInr: 520,
      distanceKm: 3,
      photoUrl: "/assets/Priya S.png",
      bio: "Fast-response support for minor plumbing fixes, filter changes, and general maintenance.",
      isVerified: false,
      serviceSlugs: ["plumbing", "delivery"],
      customRates: {
        plumbing: 499,
        delivery: 329
      }
    }
  ],
  clients: [
    {
      fullName: "Rahul Khanna",
      email: "rahul.khanna@gigconnect.in",
      phone: "9876001234",
      password: "Client@123",
      city: "Gurugram"
    },
    {
      fullName: "Nisha Verma",
      email: "nisha.verma@gigconnect.in",
      phone: "9811223344",
      password: "Client@123",
      city: "Delhi"
    }
  ],
  bookings: [
    {
      bookingCode: "GC1001",
      clientEmail: "rahul.khanna@gigconnect.in",
      professionalEmail: "ravi.kumar@gigconnect.in",
      serviceSlug: "electricians",
      preferredDate: "2026-04-25",
      preferredTimeSlot: "10:00 AM - 12:00 PM",
      addressArea: "Sector 54, Gurugram",
      budgetInr: 1200,
      details: "Inverter keeps tripping and two switches need replacement.",
      status: "confirmed"
    },
    {
      bookingCode: "GC1002",
      clientEmail: "nisha.verma@gigconnect.in",
      professionalEmail: "priya.sharma@gigconnect.in",
      serviceSlug: "plumbing",
      preferredDate: "2026-04-27",
      preferredTimeSlot: "4:00 PM - 6:00 PM",
      addressArea: "Dwarka Sector 9, Delhi",
      budgetInr: 900,
      details: "Kitchen sink leakage and washbasin tap fitting.",
      status: "pending"
    }
  ],
  reviews: [
    {
      professionalEmail: "ravi.kumar@gigconnect.in",
      clientEmail: "rahul.khanna@gigconnect.in",
      rating: 5,
      reviewText: "Very professional, explained the issue clearly, and fixed everything in one visit.",
      reviewerName: "Rahul Khanna"
    },
    {
      professionalEmail: "priya.sharma@gigconnect.in",
      clientEmail: "nisha.verma@gigconnect.in",
      rating: 5,
      reviewText: "On time, clean work, and fair pricing. I would book again.",
      reviewerName: "Nisha Verma"
    },
    {
      professionalEmail: "arjun.mehta@gigconnect.in",
      clientEmail: "rahul.khanna@gigconnect.in",
      rating: 4,
      reviewText: "Smooth airport pickup and polite behaviour throughout the trip.",
      reviewerName: "Rahul Khanna"
    }
  ],
  demoCredentials: {
    client: {
      email: "rahul.khanna@gigconnect.in",
      password: "Client@123"
    },
    professional: {
      email: "ravi.kumar@gigconnect.in",
      password: "Pro@123"
    }
  }
};
