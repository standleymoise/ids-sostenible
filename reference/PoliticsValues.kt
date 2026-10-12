package com.infonax.calculids.model

import android.content.Context
import com.infonax.calculids.R

object PoliticsValues {

    val values1 = listOf(2.0, 2.0, 1.0, -1.0, 2.0, 1.0, 1.0)

    fun getLisPol1(context: Context): List<String> {
        return listOf(
            context.getString(R.string.pol_value1_1),
            context.getString(R.string.pol_value1_2),
            context.getString(R.string.pol_value1_3),
            context.getString(R.string.pol_value1_4),
            context.getString(R.string.pol_value1_5),
            context.getString(R.string.pol_value1_6)
        )
    }
}