const {
  Application,
  Sprite,
  Container,
  ColorMatrixFilter,
  Assets,
  DisplacementFilter,
} = PIXI;

class RgbShiftEffect {
  constructor(options) {
    this.mainImg = options?.mainImg || "./pc_black.jpg";
    this.textureImg = options?.textureImg || "./texture.jpg";
    this.container;
    this.bgSprites = [];
    this.mainSprites = [];
    this.displacementFilters = [];
    this.filters = [];
    this.timeline;
    this.nodeX = 0;
    this.nodeY = 0;
    this.clientX = 0;
    this.clientY = 0;
    this.rafId_gestureMove;
    this.ghostEl = {
      x: 0,
      y: 0,
    };
    this.init();
  }
  async init() {
    const app = await this.build_scene();
    this.build_RGBcontainers(app);
    this.animateTimeLine();
    this.initialSlide();
  }
  async build_scene() {
    const self = this;
    const canvasWrapper = document.getElementById("app");
    const app = new Application();
    await app.init({
      resizeTo: window,
      backgroundAlpha: 0,
      width: innerWidth,
      height: innerHeight,
    });

    canvasWrapper.appendChild(app.canvas);

    await Assets.load([self.textureImg, self.mainImg]);
    this.container = new Container({ interactive: true });

    app.stage.addChild(this.container);
    app.stage.eventMode = "dynamic";
    app.stage.hitArea = app.screen;
    app.stage.on("pointermove", this.mouseMoveEvent.bind(self));
    // app.ticker.add((delta) => {
    //   app.renderer.render(self.container);
    // });

    return app;
  }
  build_RGBcontainers() {
    const self = this;
    const redChannelFilter = new ColorMatrixFilter();
    redChannelFilter.matrix = [
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
    ];

    const greenChannelFilter = new ColorMatrixFilter();
    greenChannelFilter.matrix = [
      0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
    ];

    const blueChannelFilter = new ColorMatrixFilter();
    blueChannelFilter.matrix = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
    ];

    this.filters = [redChannelFilter, greenChannelFilter, blueChannelFilter];
    this.bgSprites = this.filters.map(() => PIXI.Sprite.from(self.textureImg));
    this.mainSprites = this.filters.map(() => {
      const sprite = PIXI.Sprite.from(self.mainImg);
      sprite.alpha = 0;
      return sprite;
    });
    this.displacementFilters = this.filters.map(
      (d, i) => new DisplacementFilter(this.bgSprites[i])
    );

    const containers = this.filters.map((d, i) => {
      const wrapper = new Container();
      wrapper.addChild(this.bgSprites[i], this.mainSprites[i]);
      wrapper.filters = [this.displacementFilters[i], this.filters[i]];
      wrapper.filters[1].blendMode = "add";

      return wrapper;
    });

    this.container.addChild(...containers);

    this.bgSprites[0].anchor.set(0.0);
    this.bgSprites[1].anchor.set(0.5);
    this.bgSprites[2].anchor.set(0.3);
  }
  animateTimeLine() {
    const self = this;
    this.timeline = gsap.timeline({
      onStart() {
        console.log("start");
        this.firstInit = true;
        // this.isPlaying = true;
        // this.ghostEl = innerWidth;

        gsap.to(self.ghostEl, 0.25, {
          x: innerWidth,
          ease: "Power0.easeOut",
        });
        // console.log(innerWidth, self.ghostEl, "start");
      },
      onComplete() {
        console.log("complete");
        this.firstInit = false;
        // this.isPlaying = false;
        self.gestureEffect();
      },
      onUpdate() {
        console.log("update");
        if (!this.firstInit) {
          self.nodeX += (self.ghostEl.x - self.nodeX) / 3;
          self.nodeY += (self.ghostEl.y - self.nodeY) / 3;
          console.log(self.nodeX, self.nodeY);
          self.displacementFilters.map((d, i) => {
            self.displacementFilters[i].scale.x =
              Math.atan(self.nodeX - self.bgSprites[i].x) *
              this.progress() *
              350;
            self.bgSprites[i].position.x = self.nodeY * this.progress() * 2;
            return null;
          });
        }
      },
    });
  }
  initialSlide() {
    const self = this;
    // gsap.set(self.ghostEl, {
    //   x: 0,
    //   ease: "Power0.easeOut",
    // });
    console.log(self.mainSprites);
    this.timeline
      .to(
        self.mainSprites,
        0.25,
        {
          alpha: 0,
          ease: "Power0.easeOut",
        },
        0.25
      )
      .to(
        self.mainSprites,
        0.25,
        {
          alpha: 1,
          ease: Power2.easeOut,
        },
        0.25
      );
  }
  gestureEffect() {
    // re init animation
    // cancelAnimationFrame(rafId_transition);
    const self = this;

    if (this.timeline.isActive()) {
      return;
    }

    this.filters.map((d, i) => {
      this.bgSprites[i].x = 0;
      this.bgSprites[i].y = 0;

      this.displacementFilters[i].scale.x = 0;
      this.displacementFilters[i].scale.y = 0;
    });
    // ticker();
    // function ticker() {
    //   console.log("ticker");
    //   self.rafId_gestureMove = requestAnimationFrame(ticker);

    //   // make sure transition is done
    //   if (self.ghostEl.x >= innerWidth) {
    //     // get new mouse positions with dumping intensity ( between [1-10] : 1 is faster)
    //     self.nodeX += (self.clientX - self.nodeX) / 3;
    //     self.nodeY += (self.clientY - self.nodeY) / 3;

    //     console.log(self.nodeX, self.nodeY, "ticker inner");
    //     self.filters.map((d, i) => {
    //       self.displacementFilters[i].scale.x =
    //         self.nodeX - self.bgSprites[i].x;
    //       self.displacementFilters[i].scale.y =
    //         self.nodeY - self.bgSprites[i].y;

    //       // update sprite x / y values
    //       self.bgSprites[i].position.x = self.nodeX;
    //       self.bgSprites[i].position.y = self.nodeY;
    //       return;
    //     });
    //   } else {
    //     cancelAnimationFrame(self.rafId_gestureMove);
    //   }
    // }
  }
  // onMouseMove() {
  //   this.container
  //     .on("mousemove", this.mouseMoveEvent)
  //     .on("touchmove", this.mouseMoveEvent);
  // }
  mouseMoveEvent(e) {
    // self.rafId_gestureMove = requestAnimationFrame(ticker);
    const self = this;
    console.log(e.global.x, e.global.y, "mousemove");
    // self.clientX = e.clientX;
    // self.clientY = e.clientY;
    if (self.ghostEl.x >= innerWidth) {
      self.nodeX += (e.global.x - self.nodeX) / 1;
      self.nodeY += (e.global.y - self.nodeY) / 1;

      console.log(self.nodeX, self.nodeY, "ticker inner");
      self.filters.map((d, i) => {
        self.displacementFilters[i].scale.x = self.nodeX - self.bgSprites[i].x;
        self.displacementFilters[i].scale.y = self.nodeY - self.bgSprites[i].y;

        // update sprite x / y values
        self.bgSprites[i].position.x = self.nodeX;
        self.bgSprites[i].position.y = self.nodeY;
        return;
      });
    }
  }
}

new RgbShiftEffect();
