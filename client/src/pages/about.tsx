import { useEffect } from "react";
import { Link } from "wouter";
import { Trophy, Target, Users, Award, TrendingUp, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function About() {
  useEffect(() => {
    // SEO meta tags
    document.title = "About DapsiGames - Revolutionizing Education Through Gamification | DapsiGames";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Learn how DapsiGames is transforming education for students aged 13-25 through competitive gaming, interactive learning, and global leaderboards. Join 15,000+ active learners today.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Learn how DapsiGames is transforming education for students aged 13-25 through competitive gaming, interactive learning, and global leaderboards. Join 15,000+ active learners today.';
      document.head.appendChild(meta);
    }

    // Open Graph tags for social media
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', 'About DapsiGames - Revolutionizing Education Through Gamification');

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', 'Join 15,000+ learners using DapsiGames to make education engaging, competitive, and fun.');
  }, []);

  const stats = [
    { icon: Users, value: "15K+", label: "Active Learners", color: "text-primary" },
    { icon: Trophy, value: "50K+", label: "Games Played", color: "text-secondary" },
    { icon: Award, value: "100+", label: "Achievements", color: "text-accent" },
    { icon: Globe, value: "50+", label: "Countries", color: "text-primary" },
  ];

  const values = [
    {
      icon: Target,
      title: "Mission-Driven",
      description: "We're committed to making learning engaging and accessible for students worldwide through innovative gamification strategies.",
    },
    {
      icon: Users,
      title: "Community-Focused",
      description: "Building a global community where learners compete, collaborate, and grow together in a supportive environment.",
    },
    {
      icon: TrendingUp,
      title: "Results-Oriented",
      description: "Proven track record of improving student engagement, retention, and academic performance through game-based learning.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Trophy className="h-4 w-4" />
              <span>About DapsiGames</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight" data-testid="text-about-title">
              Transforming Education Through{" "}
              <span className="text-primary">Competitive Gaming</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-about-subtitle">
              We're on a mission to make learning as engaging as gaming. DapsiGames combines 
              competitive elements with educational content to create an unmatched learning experience 
              for students aged 13-25.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="hover-elevate" data-testid={`stat-card-${index}`}>
                <CardContent className="pt-6 text-center">
                  <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color}`} />
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Story</h2>
            <div className="w-20 h-1 bg-primary mx-auto mb-8"></div>
          </div>
          
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              DapsiGames was founded in 2024 with a simple yet powerful vision: to revolutionize 
              how students learn by combining the excitement of competitive gaming with effective 
              educational methodologies.
            </p>
            
            <p>
              We recognized that traditional learning methods often fail to capture the attention 
              of today's digital-native students. By integrating gamification elements like 
              leaderboards, achievements, point systems, and social competition, we've created 
              a platform that turns studying into an engaging, rewarding experience.
            </p>
            
            <p>
              Today, over 15,000 active learners across 50+ countries use DapsiGames to master 
              new subjects, compete with peers, and achieve their educational goals. Our platform 
              has facilitated over 50,000 learning sessions and helped students earn more than 
              100 different achievements while building lasting study habits.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
            <div className="w-20 h-1 bg-primary mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="hover-elevate" data-testid={`value-card-${index}`}>
                <CardContent className="pt-6 space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What Sets Us Apart */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Sets Us Apart</h2>
            <div className="w-20 h-1 bg-primary mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Real-Time Competition",
                description: "Compete with learners globally through live leaderboards and time-based challenges that keep you motivated."
              },
              {
                title: "Comprehensive Progress Tracking",
                description: "Monitor your growth with detailed analytics, achievement systems, and personalized insights."
              },
              {
                title: "Interactive Study Materials",
                description: "Access curated educational content designed to enhance learning through games and quizzes."
              },
              {
                title: "Social Learning",
                description: "Join study groups, challenge friends, and build a supportive learning community."
              },
              {
                title: "Rewards & Recognition",
                description: "Earn points, unlock badges, and climb ranks as you progress through your learning journey."
              },
              {
                title: "Mobile-Friendly Platform",
                description: "Learn anytime, anywhere with our responsive design optimized for all devices."
              },
            ].map((feature, index) => (
              <div key={index} className="space-y-2" data-testid={`feature-${index}`}>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  {feature.title}
                </h3>
                <p className="text-muted-foreground pl-4">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Transform Your Learning Experience?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of students who are already learning smarter, not harder.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" data-testid="button-cta-signup">
                Get Started Free
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" data-testid="button-cta-contact">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
