import { NextRequest } from "next/server";

export function getClientIp(req: NextRequest): string {
  let ip = req.headers.get("cf-connecting-ip") || 
           req.headers.get("x-forwarded-for") || 
           req.headers.get("x-real-ip") || 
           "127.0.0.1";
  
  if (ip === "::1" || ip.toLowerCase() === "localhost") {
    return "127.0.0.1";
  }
  
  // Jika x-forwarded-for berisi deretan proxy IP, ambil IP pertama
  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }
  
  return ip;
}
