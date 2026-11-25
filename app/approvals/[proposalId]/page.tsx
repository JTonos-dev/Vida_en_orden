import ApprovalClient from "./approval-client";
export default async function ApprovalPage({params}:{params:Promise<{proposalId:string}>}) { const {proposalId}=await params; return <ApprovalClient proposalId={proposalId}/>; }
