import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X } from "lucide-react";
import confetti from "canvas-confetti";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BadgeUnlockProps {
  isOpen: boolean;
  onClose: () => void;
  badgeName: string;
  badgeDescription: string;
  badgeIcon: string;
  pointsEarned: number;
}

export function BadgeUnlock({
  isOpen,
  onClose,
  badgeName,
  badgeDescription,
  badgeIcon,
  pointsEarned,
}: BadgeUnlockProps) {
  useEffect(() => {
    if (isOpen) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
            data-testid="badge-unlock-overlay"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              className="pointer-events-auto max-w-md w-full mx-4"
              data-testid="badge-unlock-modal"
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-background border-2 border-primary/20">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10"
                  onClick={onClose}
                  data-testid="button-close-badge-unlock"
                >
                  <X className="h-4 w-4" />
                </Button>
                
                <CardContent className="p-8 text-center space-y-6">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-primary to-secondary mb-4">
                      <Trophy className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Achievement Unlocked!
                    </h2>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="text-8xl"
                  >
                    {badgeIcon}
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                  >
                    <h3 className="text-2xl font-bold">{badgeName}</h3>
                    <p className="text-muted-foreground">{badgeDescription}</p>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-primary to-secondary">
                      +{pointsEarned} XP
                    </Badge>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button
                      onClick={onClose}
                      className="w-full"
                      size="lg"
                      data-testid="button-continue"
                    >
                      Continue
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
