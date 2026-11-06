<?php

namespace App\Support;

class RequestMetrics
{
    public bool $active = false;

    public int $queries = 0;

    public float $sqlMilliseconds = 0;

    public function start(): void
    {
        $this->queries = 0;
        $this->sqlMilliseconds = 0;
        $this->active = true;
    }

    public function record(float $milliseconds): void
    {
        if ($this->active) {
            $this->queries++;
            $this->sqlMilliseconds += $milliseconds;
        }
    }
}
