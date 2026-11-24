import { stateFor, userId } from "@/lib/home-server";
import { v2StateFor } from "@/lib/v2-server";
export const runtime = "edge";
export async function GET(request: Request) { try { const user=userId(request); const [home,v2]=await Promise.all([stateFor(),v2StateFor(user)]); return Response.json({...home,...v2}); } catch (e) { if(e instanceof Response) return e; return Response.json({error:e instanceof Error?e.message:"Error"},{status:500}); } }
