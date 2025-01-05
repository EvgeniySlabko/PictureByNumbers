import { Heap } from "./Heap";

export class PriorityQueue {
    heap: any;
    constructor() {
        this.heap = new Heap();
    }
    enqueue(obj) {
        this.heap.add(obj);
    }
    peek() {
        return this.heap.peek();
    }
    updatePriority(key) {
        this.heap.checkHeapRequirement(key);
    }
    get(key) {
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
    contains(key) {
        return this.heap.contains(key);
    }
    removeWhere(predicate) {
        this.heap.removeWhere(predicate);
    }
    foreach(func) {
        this.heap.foreach(func);
    }
    clone() {
        const p = new PriorityQueue();
        p.heap = this.heap.clone();
        return p;
    }
}