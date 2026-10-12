package com.infonax.calculids.model

import android.content.Context
import com.infonax.calculids.R

object SocialValues {

    val values1 = listOf(2.5, 2.0, 1.5, 3.0, -1.0)
    val values2 = listOf(3.0, 2.0, -1.0, -1.0, 3.0)
    val values3 = listOf(3.5, -2.0, 1.5, 3.0)
    val values4 = listOf(2.5, 2.0, 2.0, 2.0, -1.5)
    val values5 = listOf(2.0, -1.0, 2.0, -1.0, 1.0, 1.0, 2.0)
    val values6 = listOf(3.0, 2.0, 3.0, 0.0, 0.0)
    val values7 = listOf(1.5, 1.0, 1.5, 1.5, 1.5, 1.5, 1.0, 0.0)
    val values8 = listOf(2.0, 2.0, 1.5, 1.5, -1.0, 1.0, 1.0)
    val values9 = listOf(3.0, 4.0, -1.0, -0.5, -0.5)

    fun getListSoc1(context: Context): List<String> {
        return listOf(
            context.getString(R.string.soc_value1_1),
            context.getString(R.string.soc_value1_2),
            context.getString(R.string.soc_value1_3),
            context.getString(R.string.soc_value1_4),
            context.getString(R.string.soc_value1_5)
        )
    }

    fun getListSoc2(context: Context): List<String> = listOf(
        context.getString(R.string.soc_value2_1),
        context.getString(R.string.soc_value2_2),
        context.getString(R.string.soc_value2_3),
        context.getString(R.string.soc_value2_4),
        context.getString(R.string.soc_value2_5)
    )


    fun getListSoc3(context: Context): List<String> {
        return listOf(
            context.getString(R.string.soc_value3_1),
            context.getString(R.string.soc_value3_2),
            context.getString(R.string.soc_value3_3),
            context.getString(R.string.soc_value3_4)
        )
    }

    fun getListSoc4(context: Context): List<String> {
        return listOf(
            context.getString(R.string.soc_value4_1),
            context.getString(R.string.soc_value4_2),
            context.getString(R.string.soc_value4_3),
            context.getString(R.string.soc_value4_4),
            context.getString(R.string.soc_value4_5)
        )
    }

    fun getListSoc5(context: Context): List<String> {
        return listOf(
            context.getString(R.string.soc_value5_1),
            context.getString(R.string.soc_value5_2),
            context.getString(R.string.soc_value5_3),
            context.getString(R.string.soc_value5_4),
            context.getString(R.string.soc_value5_5),
            context.getString(R.string.soc_value5_6),
            context.getString(R.string.soc_value5_7)
        )
    }

    fun getListSoc6(context: Context): List<String> {
        return listOf(
            context.getString(R.string.soc_value6_1),
            context.getString(R.string.soc_value6_2),
            context.getString(R.string.soc_value6_3),
            context.getString(R.string.soc_value6_4),
            context.getString(R.string.soc_value6_5)
        )
    }

    fun getListSoc7(context: Context): List<String> {
        return listOf(
            context.getString(R.string.soc_value7_1),
            context.getString(R.string.soc_value7_2),
            context.getString(R.string.soc_value7_3),
            context.getString(R.string.soc_value7_4),
            context.getString(R.string.soc_value7_5),
            context.getString(R.string.soc_value7_6),
            context.getString(R.string.soc_value7_7),
            context.getString(R.string.soc_value7_8)
        )
    }

    fun getListSoc8(context: Context): List<String> {
        return listOf(
            context.getString(R.string.soc_value8_1),
            context.getString(R.string.soc_value8_2),
            context.getString(R.string.soc_value8_3),
            context.getString(R.string.soc_value8_4),
            context.getString(R.string.soc_value8_5),
            context.getString(R.string.soc_value8_6),
            context.getString(R.string.soc_value8_7)
        )
    }

    fun getListSoc9(context: Context): List<String> {
        return listOf(
            context.getString(R.string.soc_value9_1),
            context.getString(R.string.soc_value9_2),
            context.getString(R.string.soc_value9_3),
            context.getString(R.string.soc_value9_4),
            context.getString(R.string.soc_value9_5)
        )
    }
}