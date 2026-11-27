package scoremap.library

import scoremap.music.MusicRuleViolation

private const val MAX_TERM = 1_000_000L

/** An exact, finite rational number in lowest terms with a positive denominator; quarter notes are its unit. */
public class Fraction private constructor(
    public val numerator: Long,
    public val denominator: Long,
) : Comparable<Fraction> {
    public operator fun plus(other: Fraction): Fraction =
        of(numerator * other.denominator + other.numerator * denominator, denominator * other.denominator)

    public override fun compareTo(other: Fraction): Int =
        (numerator * other.denominator).compareTo(other.numerator * denominator)

    public override fun equals(other: Any?): Boolean =
        other is Fraction && numerator == other.numerator && denominator == other.denominator

    public override fun hashCode(): Int = 31 * numerator.hashCode() + denominator.hashCode()

    public override fun toString(): String = if (denominator == 1L) "$numerator" else "$numerator/$denominator"

    public companion object {
        public val ZERO: Fraction = Fraction(0, 1)
        public val ONE: Fraction = Fraction(1, 1)

        /** Reduces to lowest terms; refuses a zero denominator or terms beyond the exact range. */
        public fun of(
            numerator: Long,
            denominator: Long,
        ): Fraction {
            if (denominator == 0L) throw MusicRuleViolation("A fraction needs a non-zero denominator.")
            val sign = if (denominator < 0) -1 else 1
            val divisor = gcd(kotlin.math.abs(numerator), kotlin.math.abs(denominator))
            val n = sign * numerator / divisor
            val d = sign * denominator / divisor
            if (kotlin.math.abs(n) > MAX_TERM || d > MAX_TERM) throw MusicRuleViolation("A fraction is out of range.")
            return Fraction(n, d)
        }

        /** Reads "n" or "n/d"; null for anything else. */
        public fun parse(text: String): Fraction? {
            val parts = text.trim().split('/')
            val numbers = parts.map { it.toLongOrNull() }
            val valid = parts.size in 1..2 && numbers.none { it == null } && parts.none { it.startsWith("+") }
            return if (valid) runCatching { of(numbers[0]!!, numbers.getOrNull(1) ?: 1) }.getOrNull() else null
        }

        private tailrec fun gcd(
            a: Long,
            b: Long,
        ): Long = if (b == 0L) maxOf(a, 1) else gcd(b, a % b)
    }
}
