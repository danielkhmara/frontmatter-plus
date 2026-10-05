import { fakeMoment } from "./moment";

const scope = globalThis as unknown as Record<string, unknown>;

scope.window = globalThis;
scope.moment = fakeMoment;
scope.matchMedia = () => ({ matches: false });
