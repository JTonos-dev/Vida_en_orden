/** Strict calendar date, without Date.parse's normalization of nonexistent days. */
export function isCalendarDate(value:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const parsed=new Date(`${value}T12:00:00Z`);return !Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
}

export function assertTaskHierarchy(tasks:readonly {id:string;parentId:string|null}[]){
 const parents=new Map(tasks.map(task=>[task.id,task.parentId])),settled=new Set<string>();
 for(const task of tasks){let cursor:string|null=task.id;const path=new Set<string>();while(cursor&&!settled.has(cursor)){if(path.has(cursor))throw new Error("La jerarquía contiene un ciclo; requiere revisión antes de modificarla");path.add(cursor);cursor=parents.get(cursor)||null;}for(const id of path)settled.add(id);}
}
