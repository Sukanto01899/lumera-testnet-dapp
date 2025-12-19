import { Button } from "@/components/retroui/Button";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { Text } from "@/components/retroui/Text";
import { formatAddress } from "@/lib/format";
import useWalletConnect from "@/hooks/useWalletConnect";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();
  const { address, disconnect, openWalletModal, status } = useWalletConnect();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Prevent background scroll when sidebar is open
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    }
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [sidebarOpen]);

  const handleConnect = async () => {
    try {
      await openWalletModal();
    } finally {
      setSidebarOpen(false);
    }
  };

  const handleDisconnect = () => {
    setSidebarOpen(false);
    disconnect();
  };

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/wallet", label: "Account" },
    { href: "/stake", label: "Stake" },
  ];

  return (
    <header className="sticky top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-[1100px] px-4 lg:px-6">
        <div className="relative overflow-visible md:overflow-hidden rounded-none border-2 border-border bg-white/92 dark:bg-card/92 backdrop-blur retro-panel shadow-md z-[80]">
          <div className="relative flex items-center justify-between px-4 py-3 lg:px-6">
            {/* Left Logo + burger */}
            <section className="flex items-center gap-3">
              <button
                className="inline-flex md:hidden items-center justify-center h-10 w-10 border-2 border-border bg-accent shadow-sm"
                aria-label="Toggle navigation"
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen((v) => !v)}
              >
                <span className="block w-6 border-b-2 border-border mb-1" />
                <span className="block w-6 border-b-2 border-border mb-1" />
                <span className="block w-6 border-b-2 border-border" />
              </button>
              <Link href="/" className="text-2xl font-black tracking-tight">
                <Text as={"h2"} className="leading-none">
                  Lumera Hub
                </Text>
              </Link>
              <span className="retro-chip text-xs uppercase tracking-wide hidden sm:inline-flex">
                Lumera Testnet
              </span>
            </section>

            {/* Desktop nav + wallet */}
            <section className="flex items-center gap-3 lg:gap-6">
              <nav className="hidden md:flex items-center gap-2 lg:gap-3">
                {links.map((link) => {
                  const isActive =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname?.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`retro-chip text-sm ${
                        isActive ? "bg-primary text-foreground" : "bg-accent"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="hidden md:flex items-center gap-4">
                {!address ? (
                  <Button onClick={handleConnect} disabled={status === "Connecting"}>
                    {status === "Connecting" ? "Connecting..." : "Connect"}
                  </Button>
                ) : (
                  <div className="flex items-center gap-3">
                    <Text
                      className="btn-address cursor-pointer border-2 border-primary px-3 py-2 rounded-none bg-white/70 dark:bg-card/80"
                      as={"h6"}
                    >
                      {formatAddress(address, 5, -4)}
                    </Text>
                    <Button
                      className="bg-destructive text-white hover:bg-destructive/90"
                      size={"icon"}
                      onClick={handleDisconnect}
                    >
                      <LogOut />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex md:hidden items-center gap-2">
                {!address ? (
                  <Button size="sm" onClick={handleConnect} disabled={status === "Connecting"}>
                    {status === "Connecting" ? "Connecting..." : "Connect"}
                  </Button>
                ) : (
                  <Button
                    className="bg-destructive text-white hover:bg-destructive/90"
                    size={"icon"}
                    onClick={handleDisconnect}
                    aria-label="Disconnect"
                  >
                    <LogOut />
                  </Button>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar for small screens */}
          {sidebarOpen ? (
            <>
              <div
                className="fixed inset-0 z-[190] bg-black/40 backdrop-blur-sm md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="fixed inset-0 left-0 z-[200] w-[85vw] max-w-[340px] border-r-2 border-border bg-white dark:bg-card shadow-lg md:hidden flex flex-col">
                <div className="p-4 border-b-2 border-border flex items-center justify-between">
                  <Text as="h4">Account</Text>
                  <button
                    aria-label="Close sidebar"
                    className="h-10 w-10 border-2 border-border bg-accent flex items-center justify-center text-lg font-bold"
                    onClick={() => setSidebarOpen(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="flex flex-col gap-2">
                    {links.map((link) => {
                      const isActive =
                        link.href === "/"
                          ? pathname === "/"
                          : pathname?.startsWith(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`retro-chip text-sm w-full text-left ${
                            isActive ? "bg-primary text-foreground" : "bg-accent"
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                  <div className="space-y-2">
                    {!address ? (
                      <Button
                        className="w-full"
                        disabled={status === "Connecting"}
                        onClick={handleConnect}
                      >
                        {status === "Connecting" ? "Connecting..." : "Connect"}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Text className="block text-sm text-muted-foreground">Connected</Text>
                        <Text className="btn-address border-2 border-primary px-3 py-2 rounded-none bg-white/70 dark:bg-card/80 break-all" as={"h6"}>
                          {address}
                        </Text>
                        <Button
                          className="bg-destructive text-white hover:bg-destructive/90 w-full"
                          onClick={handleDisconnect}
                        >
                          Disconnect
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Header;
