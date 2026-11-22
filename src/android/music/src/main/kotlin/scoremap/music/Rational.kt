package scoremap.music

import java.math.BigInteger

public class Rational private constructor(
    public val numerator: Long,
    public val denominator: Long,
) : Comparable<Rational> {
    public companion object {
        public fun of(
            numerator: Long,
            denominator: Long = 1,
        ): Rational {
            require(denominator > 0) { "A rational denominator must be positive." }
            val n = BigInteger.valueOf(numerator)
            val d = BigInteger.valueOf(denominator)
            val divisor = n.gcd(d)
            return Rational(n.divide(divisor).longValueExact(), d.divide(divisor).longValueExact())
        }
    }

    public operator fun plus(other: Rational): Rational {
        val n =
            BigInteger
                .valueOf(numerator)
                .multiply(BigInteger.valueOf(other.denominator))
                .add(BigInteger.valueOf(other.numerator).multiply(BigInteger.valueOf(denominator)))
        val d = BigInteger.valueOf(denominator).multiply(BigInteger.valueOf(other.denominator))
        val divisor = n.gcd(d)
        return Rational(n.divide(divisor).longValueExact(), d.divide(divisor).longValueExact())
    }

    public override fun compareTo(other: Rational): Int =
        BigInteger.valueOf(numerator).multiply(BigInteger.valueOf(other.denominator)).compareTo(
            BigInteger.valueOf(other.numerator).multiply(BigInteger.valueOf(denominator)),
        )

    public override fun equals(other: Any?): Boolean =
        other is Rational && numerator == other.numerator && denominator == other.denominator

    public override fun hashCode(): Int = 31 * numerator.hashCode() + denominator.hashCode()

    public override fun toString(): String = "$numerator/$denominator"
}
