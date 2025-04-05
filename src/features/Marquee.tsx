import { Instagram, Linkedin, Youtube, type LucideIcon } from "lucide-react";
import FastMarquee from "react-fast-marquee";

type SocialLink = {
  name: string;
  href: string;
  icon: LucideIcon;
  color: string;
};

const socialLinks: SocialLink[] = [
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
    icon: Linkedin,
    color: "text-blue-600",
  },
  {
    name: "Instagram",
    href: "https://instagram.com",
    icon: Instagram,
    color: "text-pink-600",
  },
  {
    name: "YouTube",
    href: "https://youtube.com",
    icon: Youtube,
    color: "text-red-600",
  },
];

const Marquee = () => {
  return (
    <div className="py-2">
      <FastMarquee repeat={50} gradient={true} speed={40}>
        {socialLinks.map((social, index) => (
          <a
            key={index}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="mx-4 flex items-center gap-2">
              <social.icon className={`h-6 w-6 ${social.color}`} />
              <span>{social.name}</span>
            </div>
          </a>
        ))}
      </FastMarquee>
    </div>
  );
};

export default Marquee;
