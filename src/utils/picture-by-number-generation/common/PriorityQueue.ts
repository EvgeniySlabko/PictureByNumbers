import { Heap } from "./Heap";

export class PriorityQueue {
    heap: Heap;
    constructor() {
        this.heap = new Heap();
    }
    enqueue(obj: any) {
        this.heap.add(obj);
    }
    peek() {
        return this.heap.peek();
    }
    updatePriority(key: any) {
        this.heap.checkHeapRequirement(key);
    }
    get(key: any) {
        return this.heap.at(key);
    }
    get size() {
        return this.heap.size();
    }
    dequeue() {
        return this.heap.shift();
    }
    dump() {
        this.heap.dump();
    }
    contains(key: any) {
        return this.heap.contains(key);
    }
    removeWhere(predicate: (item: any) => boolean) {
        this.heap.removeWhere(predicate);
    }
    foreach(func: Function) {
        this.heap.foreach(func);
    }
    clone() {
        const p = new PriorityQueue();
        p.heap = this.heap.clone();
        return p;
    }
}