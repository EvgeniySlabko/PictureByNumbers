import { CustomMap } from "./CustomMap";

export class Heap {
  array: any;
  public keyMap: CustomMap;
  constructor() {
    this.array = [];
    this.keyMap = new CustomMap();
  }
  add(obj: any) {
    if (this.keyMap.containsKey(obj.getKey())) {
      throw new Error(
        "Item with key " + obj.getKey() + " already exists in the heap",
      );
    }
    this.array.push(obj);
    this.keyMap.put(obj.getKey(), this.array.length - 1);
    this.checkParentRequirement(this.array.length - 1);
  }
  replaceAt(idx: number, newobj: any) {
    this.array[idx] = newobj;
    this.keyMap.put(newobj.getKey(), idx);
    this.checkParentRequirement(idx);
    this.checkChildrenRequirement(idx);
  }
  shift() {
    return this.removeAt(0);
  }
  remove(obj: any) {
    const idx = this.keyMap.get(obj.getKey());
    if (idx === -1) {
      return;
    }
    this.removeAt(idx);
  }
  removeWhere(predicate: (item: any) => boolean) {
    const itemsToRemove = [];
    for (let i = this.array.length - 1; i >= 0; i--) {
      if (predicate(this.array[i])) {
        itemsToRemove.push(this.array[i]);
      }
    }
    for (const el of itemsToRemove) {
      this.remove(el);
    }
    for (const el of this.array) {
      if (predicate(el)) {
        console.log(
          "Idx of element not removed: " + this.keyMap.get(el.getKey()),
        );
        throw new Error("element not removed: " + el.getKey());
      }
    }
  }
  removeAt(idx: number) {
    const obj = this.array[idx];
    this.keyMap.remove(obj.getKey());
    const isLastElement = idx === this.array.length - 1;
    if (this.array.length > 0) {
      const newobj = this.array.pop();
      if (!isLastElement && this.array.length > 0) {
        this.replaceAt(idx, newobj);
      }
    }
    return obj;
  }
  foreach(func: Function) {
    const arr = this.array.sort((e: any, e2: any) => e.compareTo(e2));
    for (const el of arr) {
      func(el);
    }
  }
  peek() {
    return this.array[0];
  }
  contains(key: string) {
    return this.keyMap.containsKey(key);
  }
  at(key: string) {
    const obj = this.keyMap.get(key);
    if (typeof obj === "undefined") {
      return null;
    } else {
      return this.array[obj];
    }
  }
  size() {
    return this.array.length;
  }
  checkHeapRequirement(item: any) {
    const idx = this.keyMap.get(item.getKey());
    if (idx != null) {
      this.checkParentRequirement(idx);
      this.checkChildrenRequirement(idx);
    }
  }
  checkChildrenRequirement(idx: number) {
    let stop = false;
    while (!stop) {
      const left = this.getLeftChildIndex(idx);
      let right = left === -1 ? -1 : left + 1;
      if (left === -1) {
        return;
      }
      if (right >= this.size()) {
        right = -1;
      }
      let minIdx;
      if (right === -1) {
        minIdx = left;
      } else {
        minIdx =
          this.array[left].compareTo(this.array[right]) < 0 ? left : right;
      }
      if (this.array[idx].compareTo(this.array[minIdx]) > 0) {
        this.swap(idx, minIdx);
        idx = minIdx; // iteratively instead of recursion for this.checkChildrenRequirement(minIdx);
      } else {
        stop = true;
      }
    }
  }
  checkParentRequirement(idx: number) {
    let curIdx = idx;
    let parentIdx = Heap.getParentIndex(curIdx);
    while (
      parentIdx >= 0 &&
      this.array[parentIdx].compareTo(this.array[curIdx]) > 0
    ) {
      this.swap(curIdx, parentIdx);
      curIdx = parentIdx;
      parentIdx = Heap.getParentIndex(curIdx);
    }
  }
  dump() {
    if (this.size() === 0) {
      return;
    }
    const idx = 0;
    const leftIdx = this.getLeftChildIndex(idx);
    const rightIdx = leftIdx + 1;
    console.log(this.array);
    console.log("--- keymap ---");
    console.log(this.keyMap);
  }
  swap(i: number, j: number) {
    this.keyMap.put(this.array[i].getKey(), j);
    this.keyMap.put(this.array[j].getKey(), i);
    const tmp = this.array[i];
    this.array[i] = this.array[j];
    this.array[j] = tmp;
  }
  getLeftChildIndex(curIdx: number) {
    const idx = (curIdx + 1) * 2 - 1;
    if (idx >= this.array.length) {
      return -1;
    } else {
      return idx;
    }
  }
  static getParentIndex(curIdx: number) {
    if (curIdx === 0) {
      return -1;
    }
    return Math.floor((curIdx + 1) / 2) - 1;
  }
  clone() {
    const h = new Heap();
    h.array = this.array.slice(0);
    h.keyMap = this.keyMap.clone();
    return h;
  }
}
