import { useEffect } from "react";
import { Shield, Lock, Eye, Database, UserCheck, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  useEffect(() => {
    // SEO meta tags
    document.title = "Privacy Policy - DapsiGames | Your Data Protection & Privacy Rights";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Read DapsiGames Privacy Policy to understand how we collect, use, protect, and manage your personal information. Learn about your privacy rights, data security measures, and cookie policies.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Read DapsiGames Privacy Policy to understand how we collect, use, protect, and manage your personal information. Learn about your privacy rights, data security measures, and cookie policies.';
      document.head.appendChild(meta);
    }

    // Open Graph tags for social media
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', 'Privacy Policy - DapsiGames');

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', 'Learn how DapsiGames protects your personal information and respects your privacy rights.');
  }, []);

  const lastUpdated = "January 1, 2025";

  const sections = [
    {
      icon: Database,
      title: "Information We Collect",
      content: [
        {
          subtitle: "Personal Information",
          text: "When you create an account on DapsiGames, we collect information such as your name, email address, and educational preferences. This information helps us personalize your learning experience and communicate with you effectively."
        },
        {
          subtitle: "Usage Data",
          text: "We automatically collect information about your interactions with our platform, including game scores, study sessions, achievements earned, and time spent on various activities. This data helps us improve our services and provide you with insights into your learning progress."
        },
        {
          subtitle: "Device Information",
          text: "We may collect information about the devices you use to access DapsiGames, including device type, operating system, browser type, IP address, and mobile network information."
        }
      ]
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      content: [
        {
          subtitle: "Service Delivery",
          text: "We use your information to provide, maintain, and improve DapsiGames, including personalizing your learning experience, tracking your progress, and enabling competition features like leaderboards."
        },
        {
          subtitle: "Communication",
          text: "We may use your email address to send you important updates about your account, new features, achievements you've unlocked, and educational content that may interest you. You can opt out of marketing communications at any time."
        },
        {
          subtitle: "Analytics and Improvement",
          text: "We analyze usage patterns to understand how users interact with our platform, identify areas for improvement, and develop new features that enhance the learning experience."
        }
      ]
    },
    {
      icon: Lock,
      title: "Data Security",
      content: [
        {
          subtitle: "Security Measures",
          text: "We implement industry-standard security measures to protect your personal information, including encryption of data in transit and at rest, secure authentication protocols, and regular security audits."
        },
        {
          subtitle: "Access Controls",
          text: "Access to your personal information is restricted to authorized personnel who need it to perform their job functions. All team members are bound by confidentiality agreements."
        },
        {
          subtitle: "Data Breach Notification",
          text: "In the unlikely event of a data breach that may affect your personal information, we will notify you and relevant authorities as required by applicable laws."
        }
      ]
    },
    {
      icon: UserCheck,
      title: "Your Privacy Rights",
      content: [
        {
          subtitle: "Access and Portability",
          text: "You have the right to access your personal information and request a copy of your data in a portable format. You can download your data at any time from your account settings."
        },
        {
          subtitle: "Correction and Deletion",
          text: "You can update your personal information through your account settings. You also have the right to request deletion of your account and personal data, subject to certain legal obligations we may have to retain certain information."
        },
        {
          subtitle: "Opt-Out Rights",
          text: "You can opt out of marketing communications, personalized recommendations, and certain data collection practices through your privacy settings. Note that opting out may limit some features of our service."
        }
      ]
    },
    {
      icon: Shield,
      title: "Data Sharing and Disclosure",
      content: [
        {
          subtitle: "Third-Party Services",
          text: "We may share your information with trusted third-party service providers who help us operate DapsiGames, such as hosting providers, analytics services, and email delivery services. These providers are contractually obligated to protect your information."
        },
        {
          subtitle: "Legal Requirements",
          text: "We may disclose your information if required by law, court order, or government regulation, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others."
        },
        {
          subtitle: "Business Transfers",
          text: "In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity. We will notify you of any such change and any choices you may have."
        }
      ]
    },
    {
      icon: Bell,
      title: "Cookies and Tracking",
      content: [
        {
          subtitle: "Cookie Usage",
          text: "We use cookies and similar technologies to remember your preferences, authenticate your sessions, and analyze how you use our platform. You can control cookie settings through your browser preferences."
        },
        {
          subtitle: "Analytics",
          text: "We use analytics services to understand user behavior and improve our platform. These services may use cookies and other tracking technologies to collect information about your usage."
        },
        {
          subtitle: "Do Not Track",
          text: "We respect Do Not Track (DNT) browser settings. When DNT is enabled, we will not use tracking technologies for targeted advertising or behavioral analytics."
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
            <Shield className="h-4 w-4" />
            <span>Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold" data-testid="text-privacy-title">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-lg leading-relaxed">
              At DapsiGames, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our educational gaming platform. 
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy 
              policy, please do not access the platform.
            </p>
          </CardContent>
        </Card>

        {/* Main Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <Card key={index} data-testid={`privacy-section-${index}`}>
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
                    <h3 className="font-semibold mb-2">{item.subtitle}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Children's Privacy */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              DapsiGames is designed for users aged 13 and older. We do not knowingly collect personal 
              information from children under 13. If you are a parent or guardian and believe your child 
              under 13 has provided us with personal information, please contact us immediately, and we 
              will take steps to delete such information.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              For users aged 13-17, we recommend parental supervision and encourage parents to discuss 
              online privacy and safety with their children.
            </p>
          </CardContent>
        </Card>

        {/* International Users */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>International Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              DapsiGames is operated in the United States. If you are accessing our platform from outside 
              the United States, please be aware that your information may be transferred to, stored, and 
              processed in the United States where our servers are located and our central database is 
              operated.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By using DapsiGames, you consent to the transfer of your information to the United States 
              and its use and disclosure in accordance with this Privacy Policy and applicable laws.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Changes to This Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices, 
              technologies, legal requirements, and other factors. We will notify you of any material 
              changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We encourage you to review this Privacy Policy periodically to stay informed about how we 
              are protecting your information.
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
              If you have questions or concerns about this Privacy Policy or our data practices, please 
              contact us at:
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> privacy@dapsigames.com</p>
              <p><strong>Address:</strong> 123 Education Street, San Francisco, CA 94102</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
