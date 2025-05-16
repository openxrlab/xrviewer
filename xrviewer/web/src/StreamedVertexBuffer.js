export default class StreamedVertexBuffer {
  constructor() {
    // a buffer that stores coordinates of smpl vertices sequentially
    this.data = [];
    this.index = [];
    // whether the buffer should receive the incoming vertex data
    this.isOpen = true;

    this.max_buffer_size = 256;
  }

  enqueue(verts: Number[], idx: Number) {
    this.data.push(verts);
    this.index.push(idx);

    return true;
  }

  // Get the vertices that are on the buffer head
  head() {
    if (this.data.length === 0) {
      return [undefined, -1];
    }

    return [this.data[0], this.index[0]];
  }

  dequeue() {
    return [this.data.shift(), this.index.shift()];
  }

  reset() {
    this.data = [];
    this.index = [];
    this.isOpen = true;
  }

  isEmpty() {
    return (this.data.length === 0);
  }

  isFull() {
    return (this.data.length >= this.max_buffer_size);
  }

  isPushable(buffer_head_idx: Number, num_frames: Number) {
    return (
      this.data.length < this.max_buffer_size
        // Consider whether vertex sequence is enough for playing the subsequent animations
        // Notice that explicit type conversion here is necessary
        && Number(buffer_head_idx) + Number(this.data.length) < Number(num_frames)
    );
  }

  length() {
    return this.data.length;
  }

  setIsOpen(isOpen: Boolean) {
    this.isOpen = isOpen;
  }
}
