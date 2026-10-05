export class FakeElement {
  text = "";
  visible = true;
  classes = new Set<string>();

  setText(text: string): void {
    this.text = text;
  }

  show(): void {
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  addClass(...names: string[]): void {
    for (const name of names) this.classes.add(name);
  }
}
