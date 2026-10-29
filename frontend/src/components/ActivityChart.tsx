import type { HourBucket } from "../api/types";

function niceTop(max: number) {
  // Quarter steps must land on whole counts: round the top up to a
  // multiple of four so the y ticks read 0, 2, 4, 6, 8 rather than
  // 0, 3, 5, 8, 10.
  return Math.max(4, Math.ceil(max / 4) * 4);
}

export function ActivityChart({ buckets }: { buckets: HourBucket[] }) {
  const maxRuns = Math.max(0, ...buckets.map((bucket) => bucket.runs));
  const top = niceTop(Math.max(1, maxRuns));
  const ticks = [1, 0.75, 0.5, 0.25, 0];
  const totalRuns = buckets.reduce((sum, bucket) => sum + bucket.runs, 0);
  const totalFailures = buckets.reduce(
    (sum, bucket) => sum + bucket.failures,
    0,
  );
  const labelEvery = 4;

  return (
    <figure
      className="activity"
      aria-label="Executions per hour over the last 24 hours"
    >
      <div className="activity-grid-wrap">
        <div className="activity-y" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick}>{Math.round(top * tick)}</span>
          ))}
        </div>

        <div className="activity-plot">
          <div className="activity-grid" aria-hidden="true">
            {ticks.map((tick) => (
              <span key={tick} style={{ bottom: `${tick * 100}%` }} />
            ))}
          </div>

          <div className="activity-bars">
            {buckets.map((bucket) => {
              const height = (bucket.runs / top) * 100;
              const label = `${bucket.label}: ${bucket.runs} ${
                bucket.runs === 1 ? "execution" : "executions"
              }${bucket.failures > 0 ? `, ${bucket.failures} failed` : ""}`;

              return (
                <div className="activity-col" key={bucket.start} title={label}>
                  <span
                    className="activity-bar"
                    style={{ height: `${height}%` }}
                    aria-hidden="true"
                  />
                  <span className="sr-only">{label}</span>
                </div>
              );
            })}
          </div>

          <div className="activity-x" aria-hidden="true">
            {buckets.map((bucket, index) => (
              <span key={bucket.start}>
                {index % labelEvery === 0 ? bucket.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      <figcaption className="chart-note">
        <span>
          <span className="mono">{totalRuns}</span>{" "}
          {totalRuns === 1 ? "execution" : "executions"} in this window
        </span>
        <span className={totalFailures > 0 ? "negative" : undefined}>
          {totalFailures > 0
            ? `${totalFailures} failed`
            : "No failed executions"}
        </span>
      </figcaption>
    </figure>
  );
}
