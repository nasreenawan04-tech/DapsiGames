import { useEffect } from "react";
import { FileText, Scale, AlertTriangle, CheckCircle, XCircle, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfService() {
  useEffect(() => {
    // SEO meta tags
    document.title = "Terms of Service - DapsiGames | User Agreement & Platform Rules";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Read DapsiGames Terms of Service to understand the rules, responsibilities, and guidelines for using our educational gaming platform. Learn about user accounts, acceptable use, and our policies.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Read DapsiGames Terms of Service to understand the rules, responsibilities, and guidelines for using our educational gaming platform. Learn about user accounts, acceptable use, and our policies.';
      document.head.appendChild(meta);
    }

    // Open Graph tags for social media
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', 'Terms of Service - DapsiGames');

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', 'Read our Terms of Service to understand the rules and guidelines for using DapsiGames.');
  }, []);

  const lastUpdated = "January 1, 2025";

  const sections = [
    {
      icon: CheckCircle,
      title: "Acceptance of Terms",
      content: [
        {
          text: "By accessing and using DapsiGames, you accept and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you may not use our platform."
        },
        {
          text: "These terms apply to all users of DapsiGames, including students, educators, and visitors who access our platform without an account."
        },
        {
          text: "We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the modified terms."
        }
      ]
    },
    {
      icon: FileText,
      title: "User Accounts",
      content: [
        {
          subtitle: "Account Creation",
          text: "To access most features of DapsiGames, you must create an account. You must be at least 13 years old to create an account. Users under 18 should have parental permission."
        },
        {
          subtitle: "Account Security",
          text: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account."
        },
        {
          subtitle: "Accurate Information",
          text: "You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete."
        },
        {
          subtitle: "Account Termination",
          text: "We reserve the right to suspend or terminate your account at any time for violation of these Terms of Service, illegal activities, or for any other reason we deem appropriate."
        }
      ]
    },
    {
      icon: XCircle,
      title: "Prohibited Activities",
      content: [
        {
          subtitle: "You May Not:",
          text: "Use the platform for any illegal purpose or in violation of any local, state, national, or international law."
        },
        {
          text: "Harass, abuse, or harm other users through any form of communication on our platform."
        },
        {
          text: "Attempt to gain unauthorized access to any portion of the platform, other user accounts, or computer systems connected to the platform."
        },
        {
          text: "Upload, transmit, or distribute viruses, malware, or any other malicious code."
        },
        {
          text: "Use automated systems (bots, scrapers, etc.) to access the platform without our express written permission."
        },
        {
          text: "Cheat, exploit bugs, or manipulate the leaderboard or game scoring systems."
        },
        {
          text: "Impersonate any person or entity or falsely state or misrepresent your affiliation with any person or entity."
        }
      ]
    },
    {
      icon: Scale,
      title: "Intellectual Property Rights",
      content: [
        {
          subtitle: "Platform Content",
          text: "All content on DapsiGames, including text, graphics, logos, icons, images, audio clips, video clips, data compilations, and software, is the property of DapsiGames or its content suppliers and is protected by international copyright laws."
        },
        {
          subtitle: "User Content",
          text: "You retain ownership of any content you submit to DapsiGames. However, by submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display such content in connection with operating and promoting the platform."
        },
        {
          subtitle: "Trademarks",
          text: "DapsiGames and related logos are trademarks of DapsiGames. You may not use these trademarks without our prior written consent."
        }
      ]
    },
    {
      icon: Shield,
      title: "Educational Use",
      content: [
        {
          subtitle: "Platform Purpose",
          text: "DapsiGames is designed as an educational platform to enhance learning through gamification. While we strive to provide accurate and valuable educational content, we do not guarantee that our platform will meet all educational requirements or learning objectives."
        },
        {
          subtitle: "Not Academic Accreditation",
          text: "Achievements, badges, and points earned on DapsiGames are for motivational and tracking purposes only and do not constitute formal academic credits or certifications."
        },
        {
          subtitle: "Supplementary Tool",
          text: "DapsiGames should be used as a supplementary learning tool and not as a replacement for formal education, professional tutoring, or academic instruction."
        }
      ]
    },
    {
      icon: AlertTriangle,
      title: "Disclaimers and Limitations",
      content: [
        {
          subtitle: "No Warranties",
          text: 'DapsiGames is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.'
        },
        {
          subtitle: "Service Availability",
          text: "We do not guarantee that DapsiGames will be available at all times or that it will be error-free. We may suspend, withdraw, or restrict access to all or part of the platform for business and operational reasons."
        },
        {
          subtitle: "Third-Party Links",
          text: "Our platform may contain links to third-party websites. We are not responsible for the content, accuracy, or practices of these third-party sites."
        },
        {
          subtitle: "Limitation of Liability",
          text: "To the fullest extent permitted by law, DapsiGames shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Scale className="h-4 w-4" />
            <span>Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold" data-testid="text-terms-title">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-lg leading-relaxed">
              Welcome to DapsiGames. These Terms of Service ("Terms") govern your access to and use of 
              the DapsiGames platform, including our website, mobile applications, and related services 
              (collectively, the "Platform"). Please read these Terms carefully before using our Platform.
            </p>
          </CardContent>
        </Card>

        {/* Main Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <Card key={index} data-testid={`terms-section-${index}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.content.map((item, idx) => (
                  <div key={idx}>
                    {item.subtitle && (
                      <h3 className="font-semibold mb-2">{item.subtitle}</h3>
                    )}
                    <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Sections */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Payment and Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Free and Paid Features</h3>
              <p className="text-muted-foreground leading-relaxed">
                DapsiGames offers both free and premium features. Free features are available to all registered 
                users. Premium features require a paid subscription.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Subscription Terms</h3>
              <p className="text-muted-foreground leading-relaxed">
                Paid subscriptions automatically renew unless cancelled before the renewal date. You may cancel 
                your subscription at any time through your account settings. Refunds are subject to our refund policy.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Price Changes</h3>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to change our pricing at any time. We will provide you with advance notice 
                of any price changes for active subscriptions.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Privacy and Data Protection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Your privacy is important to us. Our collection and use of personal information is described in 
              our Privacy Policy. By using DapsiGames, you consent to our collection and use of personal data 
              as outlined in the Privacy Policy.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Dispute Resolution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Governing Law</h3>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the State of 
                California, United States, without regard to its conflict of law provisions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Arbitration</h3>
              <p className="text-muted-foreground leading-relaxed">
                Any disputes arising from these Terms or your use of DapsiGames will be resolved through 
                binding arbitration, except that either party may seek injunctive relief in court for 
                infringement of intellectual property rights.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Severability</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be 
              limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain 
              in full force and effect.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> legal@dapsigames.com</p>
              <p><strong>Address:</strong> 123 Education Street, San Francisco, CA 94102</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
