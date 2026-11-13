/**
 * SignalPath: an isometric cluster of seven microservice nodes on a plinth.
 * The node under the pointer rises and illuminates, casting its causal blast radius
 * across downstream dependency conduits. The slider controls the telemetry intensity radius.
 */
const {
  Cam, clamp, facing, fit, prism, proj, rings, unproj, spring, stepS,
  flatDot, mk, place, pointer, put, register, disposer, solid, rrect, poly, open
} = HL;

const NODES_DATA = [
  { id: 0, label: "ingress", x: 40, y: 40, z0: 12, h0: 20 },
  { id: 1, label: "orders", x: 90, y: 50, z0: 16, h0: 28 },
  { id: 2, label: "auth", x: 45, y: 95, z0: 10, h0: 18 },
  { id: 3, label: "payment", x: 135, y: 55, z0: 14, h0: 24 },
  { id: 4, label: "inventory", x: 100, y: 105, z0: 24, h0: 38 },
  { id: 5, label: "replica", x: 155, y: 110, z0: 8, h0: 16 },
  { id: 6, label: "cache", x: 145, y: 155, z0: 10, h0: 18 },
];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.58);
  fit(C, [[-10, -10, 0], [200, 200, 0], [200, -10, 0], [-10, 200, 0], [100, 100, 50]], 200, 160);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [pr, pi] = rings(-10, -10, 200, 200, 8, 2.5);
  put(solid(g), prism(P, front, pr, pi, -4, 0));

  const nodes = NODES_DATA.map((n) => {
    const [ring, inner] = rings(n.x - 12, n.y - 12, n.x + 12, n.y + 12, 3, 1.2);
    return {
      ...n,
      ring,
      inner,
      sp: spring(n.h0, { eps: 0.05 }),
      el: solid(g),
      drawn: NaN,
    };
  });

  let over = null;

  function tick() {
    let moving = false;
    nodes.forEach((n) => {
      const target = over === n ? n.h0 + 14 : n.h0;
      stepS(n.sp, target);
      if (Math.abs(n.sp.x - n.drawn) > 0.05) {
        moving = true;
        n.drawn = n.sp.x;
        put(n.el, prism(P, front, n.ring, n.inner, 0, n.sp.x));
        n.el.sil.classList.toggle("hi", over === n || (over === null && n.id === 4));
      }
    });
    return moving;
  }

  bag.add(register(stage, tick));

  const p = pointer(stage, {
    move([sx, sy]) {
      const [wx, wy] = unproj(C, sx, sy, 0);
      let closest = null, minDist = 40;
      nodes.forEach((n) => {
        const d = Math.hypot(wx - n.x, wy - n.y);
        if (d < minDist) {
          minDist = d;
          closest = n;
        }
      });
      if (closest !== over) {
        over = closest;
        read.textContent = over ? `${over.label}` : "rest";
        stage.wake();
      }
    },
    leave() {
      if (over !== null) {
        over = null;
        read.textContent = "rest";
        stage.wake();
      }
    },
  });
  bag.add(p);

  read.textContent = "rest";
  stage.wake();

  return {
    set(v) {
      stage.wake();
    },
    destroy() {
      bag.dispose();
    },
  };
}

hairline({
  name: "signalpath",
  means: "An isometric telemetry constellation where pointer proximity reveals causal blast radius and node degradation.",
  rules: [1, 2, 4, 5, 8],
  range: [3, 5, 8],
  tour: [[160, 120], [200, 160], [240, 200]],
  mount,
});
